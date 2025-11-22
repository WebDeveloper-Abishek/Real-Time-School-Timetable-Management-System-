import TimetableSlot from '../models/TimetableSlot.js';

/**
 * Initialize the 10 default time slots for the school timetable
 * This should be run once during system setup
 */
export const initializeTimeSlots = async () => {
  try {
    // Check if slots already exist
    const existingSlots = await TimetableSlot.countDocuments();
    if (existingSlots > 0) {
      console.log('⏰ Time slots already initialized');
      return { success: true, message: 'Slots already exist' };
    }

    // Define the 10 standard time slots
    const timeSlots = [
      { slot_number: 1, start_time: '07:00', end_time: '07:30', slot_type: 'Assembly' },
      { slot_number: 2, start_time: '07:30', end_time: '08:15', slot_type: 'Period' },
      { slot_number: 3, start_time: '08:15', end_time: '09:00', slot_type: 'Period' },
      { slot_number: 4, start_time: '09:00', end_time: '09:45', slot_type: 'Period' },
      { slot_number: 5, start_time: '09:45', end_time: '10:30', slot_type: 'Period' },
      { slot_number: 6, start_time: '10:30', end_time: '10:45', slot_type: 'Break' },
      { slot_number: 7, start_time: '10:45', end_time: '11:30', slot_type: 'Period' },
      { slot_number: 8, start_time: '11:30', end_time: '12:15', slot_type: 'Period' },
      { slot_number: 9, start_time: '12:15', end_time: '13:00', slot_type: 'Period' },
      { slot_number: 10, start_time: '13:00', end_time: '13:45', slot_type: 'Period' }
    ];

    // Insert all slots
    await TimetableSlot.insertMany(timeSlots);
    
    console.log('✅ Successfully initialized 10 time slots:');
    console.log('   - Slot 1: Assembly (07:00-07:30)');
    console.log('   - Slots 2-5: Periods 1-4 (07:30-10:30)');
    console.log('   - Slot 6: Interval/Break (10:30-10:45)');
    console.log('   - Slots 7-10: Periods 5-8 (10:45-13:45)');
    
    return { success: true, message: 'Time slots initialized successfully' };
  } catch (error) {
    console.error('❌ Error initializing time slots:', error);
    throw error;
  }
};

/**
 * Get all time slots
 */
export const getAllTimeSlots = async () => {
  try {
    const slots = await TimetableSlot.find().sort({ slot_number: 1 });
    return slots;
  } catch (error) {
    console.error('❌ Error fetching time slots:', error);
    throw error;
  }
};

/**
 * Get academic period slots only (exclude Assembly and Break)
 */
export const getAcademicSlots = async () => {
  try {
    const slots = await TimetableSlot.find({ slot_type: 'Period' }).sort({ slot_number: 1 });
    return slots;
  } catch (error) {
    console.error('❌ Error fetching academic slots:', error);
    throw error;
  }
};

export default {
  initializeTimeSlots,
  getAllTimeSlots,
  getAcademicSlots
};
