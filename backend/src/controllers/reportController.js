import { query } from '../config/postgres.js';
import { publishStockUpdate } from '../services/kafkaProducer.js';
import { sseService } from '../services/sseService.js';

/**
 * Get Lost Opportunity Report ranking the most searched unavailable/out-of-stock items
 */
export async function getLostOpportunityReport(req, res) {
  try {
    const result = await query(
      `SELECT * FROM lost_opportunities ORDER BY search_count DESC, last_searched_at DESC LIMIT 50`
    );

    const totalLostSearches = result.rows.reduce((acc, row) => acc + (parseInt(row.search_count, 10) || 0), 0);
    const totalEstLostRevenue = result.rows.reduce((acc, row) => acc + (parseFloat(row.estimated_lost_revenue) || 0), 0);

    res.json({
      summary: {
        totalLostSearches,
        totalEstLostRevenue: Math.round(totalEstLostRevenue * 100) / 100,
        uniqueMissedQueries: result.rows.length,
      },
      opportunities: result.rows,
    });
  } catch (err) {
    console.error('[ReportController] getLostOpportunityReport error:', err);
    res.status(500).json({ error: 'Failed to generate lost opportunity report' });
  }
}

/**
 * Quick restock action from the lost opportunity report
 */
export async function restockOpportunity(req, res) {
  try {
    const { id, product_id, stock_to_add = 10, store_id } = req.body;

    if (product_id) {
      await query('UPDATE products SET central_stock = central_stock + $1 WHERE id = $2', [stock_to_add, product_id]);
      if (store_id) {
        await query('UPDATE store_inventory SET stock = stock + $1 WHERE store_id = $2 AND product_id = $3', [stock_to_add, store_id, product_id]);
      }

      // Check new stock
      const pRes = await query('SELECT central_stock FROM products WHERE id = $1', [product_id]);
      const newStock = pRes.rows[0]?.central_stock || stock_to_add;

      // Broadcast and Kafka
      publishStockUpdate(product_id, store_id, newStock, 'RESTOCKED_FROM_LOST_OPPORTUNITY')
        .catch(err => console.error('[ReportController] Kafka publish error:', err));
      sseService.broadcastInventoryChange(product_id, store_id, newStock);
    }

    if (id) {
      // Mark or reduce lost opportunity
      await query('DELETE FROM lost_opportunities WHERE id = $1', [id]);
    }

    res.json({
      message: 'Product restocked successfully and removed from missed demand list.',
      messageKn: 'ಉತ್ಪನ್ನವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ ಮತ್ತು ಬೇಡಿಕೆ ಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕಲಾಗಿದೆ.',
    });
  } catch (err) {
    console.error('[ReportController] restockOpportunity error:', err);
    res.status(500).json({ error: 'Failed to restock item', details: err.message });
  }
}
