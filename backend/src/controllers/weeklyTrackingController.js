import { processWeeklyCourseLimitReduction, getCurrentWeekNumber, isEndOfWeek } from '../services/weeklyTrackingService.js';

/**
 * Manual trigger for weekly course limit reduction
 * Admin can call this to process weekly reductions manually
 */
export const processWeeklyReduction = async (req, res) => {
  try {
    const result = await processWeeklyCourseLimitReduction();
    res.json({
      success: true,
      message: 'Weekly course limit reduction processed successfully',
      ...result
    });
  } catch (error) {
    console.error('Error processing weekly reduction:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing weekly reduction',
      error: error.message
    });
  }
};

/**
 * Get current week number for a term
 */
export const getWeekNumber = async (req, res) => {
  try {
    const { term_id } = req.query;
    
    if (!term_id) {
      return res.status(400).json({ message: 'term_id is required' });
    }
    
    const weekNumber = await getCurrentWeekNumber(term_id);
    res.json({
      success: true,
      week_number: weekNumber,
      is_end_of_week: isEndOfWeek()
    });
  } catch (error) {
    console.error('Error getting week number:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting week number',
      error: error.message
    });
  }
};

