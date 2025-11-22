import TimetableSlot from '../models/TimetableSlot.js';
import { initializeTimeSlots, getAllTimeSlots, getAcademicSlots } from '../utils/initializeTimeSlots.js';

/**
 * Initialize the 10 default time slots
 */
export const initSlots = async (req, res) => {
  try {
    const result = await initializeTimeSlots();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error initializing time slots:', error);
    return res.status(500).json({ message: 'Error initializing time slots', error: error.message });
  }
};

/**
 * Get all time slots
 */
export const getSlots = async (req, res) => {
  try {
    const slots = await getAllTimeSlots();
    return res.json({ slots, count: slots.length });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return res.status(500).json({ message: 'Error fetching time slots' });
  }
};

/**
 * Get academic period slots only
 */
export const getAcademicPeriods = async (req, res) => {
  try {
    const slots = await getAcademicSlots();
    return res.json({ slots, count: slots.length });
  } catch (error) {
    console.error('Error fetching academic slots:', error);
    return res.status(500).json({ message: 'Error fetching academic slots' });
  }
};

/**
 * Update a specific time slot
 */
export const updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, slot_type, is_active } = req.body;

    const slot = await TimetableSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    if (start_time) slot.start_time = start_time;
    if (end_time) slot.end_time = end_time;
    if (slot_type) slot.slot_type = slot_type;
    if (typeof is_active === 'boolean') slot.is_active = is_active;

    await slot.save();
    return res.json({ message: 'Time slot updated successfully', slot });
  } catch (error) {
    console.error('Error updating time slot:', error);
    return res.status(500).json({ message: 'Error updating time slot' });
  }
};

export default {
  initSlots,
  getSlots,
  getAcademicPeriods,
  updateSlot
};
