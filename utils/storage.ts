import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeBlockData } from '@/components/TimeBlock';

const BLOCKS_KEY = 'timeBlocks';
const CATEGORIES_KEY = 'blockCategories';
const REFLECTIONS_KEY = 'dailyReflections';
const SETTINGS_KEY = 'appSettings';

export interface BlockCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface DailyReflection {
  date: string;
  blockId: string;
  blockTitle: string;
  reflection: string;
  rating: number;
}

export interface AppSettings {
  isDarkMode: boolean;
  notificationsEnabled: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  defaultDuration: number;
}

// Helper function to sort blocks by date and time
const sortBlocksByDateTime = (blocks: TimeBlockData[]): TimeBlockData[] => {
  return blocks.sort((a, b) => {
    // First sort by date
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // If dates are the same, sort by time
    const timeA = a.startTime.split(':').map(Number);
    const timeB = b.startTime.split(':').map(Number);
    const minutesA = timeA[0] * 60 + timeA[1];
    const minutesB = timeB[0] * 60 + timeB[1];
    return minutesA - minutesB;
  });
};

// Helper function to filter blocks by date
export const filterBlocksByDate = (blocks: TimeBlockData[], date: string): TimeBlockData[] => {
  return blocks.filter(block => block.date === date);
};

// Helper function to get today's date string
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to get blocks for a specific date range
export const getBlocksInDateRange = (blocks: TimeBlockData[], startDate: string, endDate: string): TimeBlockData[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return blocks.filter(block => {
    const blockDate = new Date(block.date);
    return blockDate >= start && blockDate <= end;
  });
};

// Settings
export const saveSettings = async (settings: AppSettings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const loadSettings = async (): Promise<AppSettings> => {
  try {
    const settings = await AsyncStorage.getItem(SETTINGS_KEY);
    return settings ? JSON.parse(settings) : getDefaultSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
};

// Time Blocks
export const saveTimeBlocks = async (blocks: TimeBlockData[]) => {
  try {
    // Always sort blocks by date and time before saving
    const sortedBlocks = sortBlocksByDateTime(blocks);
    await AsyncStorage.setItem(BLOCKS_KEY, JSON.stringify(sortedBlocks));
  } catch (error) {
    console.error('Error saving time blocks:', error);
  }
};

export const loadTimeBlocks = async (): Promise<TimeBlockData[]> => {
  try {
    const blocks = await AsyncStorage.getItem(BLOCKS_KEY);
    const loadedBlocks = blocks ? JSON.parse(blocks) : [];
    // Always return sorted blocks
    return sortBlocksByDateTime(loadedBlocks);
  } catch (error) {
    console.error('Error loading time blocks:', error);
    return [];
  }
};

// Load blocks for today only
export const loadTodayBlocks = async (): Promise<TimeBlockData[]> => {
  try {
    const allBlocks = await loadTimeBlocks();
    const today = getTodayDateString();
    return filterBlocksByDate(allBlocks, today);
  } catch (error) {
    console.error('Error loading today blocks:', error);
    return [];
  }
};

// Categories
export const saveCategories = async (categories: BlockCategory[]) => {
  try {
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories:', error);
  }
};

export const loadCategories = async (): Promise<BlockCategory[]> => {
  try {
    const categories = await AsyncStorage.getItem(CATEGORIES_KEY);
    return categories ? JSON.parse(categories) : getDefaultCategories();
  } catch (error) {
    console.error('Error loading categories:', error);
    return getDefaultCategories();
  }
};

// Reflections
export const saveReflection = async (reflection: DailyReflection) => {
  try {
    const existing = await loadReflections();
    const updated = [...existing.filter(r => r.blockId !== reflection.blockId || r.date !== reflection.date), reflection];
    await AsyncStorage.setItem(REFLECTIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving reflection:', error);
  }
};

export const loadReflections = async (): Promise<DailyReflection[]> => {
  try {
    const reflections = await AsyncStorage.getItem(REFLECTIONS_KEY);
    return reflections ? JSON.parse(reflections) : [];
  } catch (error) {
    console.error('Error loading reflections:', error);
    return [];
  }
};

// ENHANCED RESET FUNCTIONALITY - Complete data wipe
export const resetAllData = async (): Promise<boolean> => {
  try {
    console.log('Starting complete data reset...');
    
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('All AsyncStorage keys:', allKeys);
    
    // Define all possible app keys
    const appKeys = [
      BLOCKS_KEY,
      CATEGORIES_KEY, 
      REFLECTIONS_KEY,
      SETTINGS_KEY,
      'app_theme_mode' // Theme storage key from ThemeContext
    ];
    
    // Filter keys that exist and belong to our app
    const keysToRemove = allKeys.filter(key => appKeys.includes(key));
    console.log('Keys to remove:', keysToRemove);
    
    // Remove all app-related data
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('Successfully removed keys:', keysToRemove);
    }
    
    // Verify removal by checking if keys still exist
    const remainingKeys = await AsyncStorage.getAllKeys();
    const stillExists = remainingKeys.filter(key => appKeys.includes(key));
    
    if (stillExists.length > 0) {
      console.warn('Some keys still exist after removal:', stillExists);
      // Try to remove them individually
      for (const key of stillExists) {
        await AsyncStorage.removeItem(key);
      }
    }
    
    console.log('Complete data reset successful - all data cleared');
    return true;
  } catch (error) {
    console.error('Error resetting all data:', error);
    throw error;
  }
};

// NEW: Add sample data function
export const addSampleData = async (): Promise<boolean> => {
  try {
    console.log('Adding sample data...');
    
    // Add sample data (already sorted)
    await saveTimeBlocks(getDefaultBlocks());
    await saveCategories(getDefaultCategories());
    await saveSettings(getDefaultSettings());
    
    // Add sample reflections for completed blocks
    const sampleReflections = getDefaultReflections();
    for (const reflection of sampleReflections) {
      await saveReflection(reflection);
    }
    
    console.log('Sample data added successfully');
    return true;
  } catch (error) {
    console.error('Error adding sample data:', error);
    throw error;
  }
};

// Clear specific data types
export const clearTimeBlocks = async () => {
  try {
    await AsyncStorage.removeItem(BLOCKS_KEY);
  } catch (error) {
    console.error('Error clearing time blocks:', error);
  }
};

export const clearCategories = async () => {
  try {
    await AsyncStorage.removeItem(CATEGORIES_KEY);
    await saveCategories(getDefaultCategories());
  } catch (error) {
    console.error('Error clearing categories:', error);
  }
};

export const clearReflections = async () => {
  try {
    await AsyncStorage.removeItem(REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error clearing reflections:', error);
  }
};

export const clearSettings = async () => {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    await saveSettings(getDefaultSettings());
  } catch (error) {
    console.error('Error clearing settings:', error);
  }
};

// Debug function to check storage state
export const debugStorage = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('=== STORAGE DEBUG ===');
    console.log('All keys:', allKeys);
    
    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`${key}:`, value ? JSON.parse(value) : null);
    }
    console.log('=== END DEBUG ===');
  } catch (error) {
    console.error('Error debugging storage:', error);
  }
};

// Check if app has any data
export const hasAnyData = async (): Promise<boolean> => {
  try {
    const [blocks, reflections] = await Promise.all([
      loadTimeBlocks(),
      loadReflections()
    ]);
    
    return blocks.length > 0 || reflections.length > 0;
  } catch (error) {
    console.error('Error checking for data:', error);
    return false;
  }
};

// Default data
const getDefaultSettings = (): AppSettings => ({
  isDarkMode: false,
  notificationsEnabled: true,
  workingHours: {
    start: '09:00',
    end: '17:00',
  },
  defaultDuration: 60,
});

const getDefaultBlocks = (): TimeBlockData[] => {
  const today = getTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];
  
  return [
    // Yesterday's completed blocks
    {
      id: 'yesterday-1',
      title: 'Morning Planning Session',
      date: yesterdayString,
      startTime: '08:30',
      endTime: '09:30',
      category: 'Admin',
      color: '#2E8B8B',
      tasks: ['Review weekly goals', 'Plan daily priorities', 'Check calendar'],
      isActive: false,
      isCompleted: true,
      progress: 100,
    },
    {
      id: 'yesterday-2',
      title: 'Deep Work - Feature Development',
      date: yesterdayString,
      startTime: '10:00',
      endTime: '12:00',
      category: 'Creative',
      color: '#FF6B35',
      tasks: ['Implement user authentication', 'Write unit tests', 'Code review'],
      isActive: false,
      isCompleted: true,
      progress: 100,
    },
    {
      id: 'yesterday-3',
      title: 'Learning Session',
      date: yesterdayString,
      startTime: '14:00',
      endTime: '15:30',
      category: 'Learning',
      color: '#4F8B3B',
      tasks: ['React Native tutorial', 'Practice animations', 'Take notes'],
      isActive: false,
      isCompleted: true,
      progress: 100,
    },
    
    // Today's blocks (mix of completed and pending)
    {
      id: 'today-1',
      title: 'Morning Deep Work',
      date: today,
      startTime: '09:00',
      endTime: '11:00',
      category: 'Creative',
      color: '#FF6B35',
      tasks: ['Review project requirements', 'Design system architecture'],
      isActive: false,
      isCompleted: true,
      progress: 100,
    },
    {
      id: 'today-2',
      title: 'Team Standup',
      date: today,
      startTime: '11:00',
      endTime: '11:30',
      category: 'Admin',
      color: '#2E8B8B',
      tasks: ['Share yesterday progress', 'Discuss blockers'],
      isActive: false,
      isCompleted: true,
      progress: 100,
    },
    {
      id: 'today-3',
      title: 'Focused Coding',
      date: today,
      startTime: '13:00',
      endTime: '15:00',
      category: 'Creative',
      color: '#FF6B35',
      tasks: ['Implement user authentication', 'Write unit tests'],
      isActive: false,
      isCompleted: false,
      progress: 0,
    },
    {
      id: 'today-4',
      title: 'Email & Communications',
      date: today,
      startTime: '15:00',
      endTime: '15:30',
      category: 'Admin',
      color: '#2E8B8B',
      tasks: ['Reply to client emails', 'Update project status'],
      isActive: false,
      isCompleted: false,
      progress: 0,
    },
    {
      id: 'today-5',
      title: 'Personal Development',
      date: today,
      startTime: '16:00',
      endTime: '17:00',
      category: 'Personal',
      color: '#8B4F9F',
      tasks: ['Read productivity articles', 'Plan weekend goals'],
      isActive: false,
      isCompleted: false,
      progress: 0,
    },
    
    // Tomorrow's planned blocks
    {
      id: 'tomorrow-1',
      title: 'Weekly Planning Session',
      date: tomorrowString,
      startTime: '09:00',
      endTime: '10:00',
      category: 'Admin',
      color: '#2E8B8B',
      tasks: ['Review last week', 'Set weekly goals', 'Plan major tasks'],
      isActive: false,
      isCompleted: false,
      progress: 0,
    },
    {
      id: 'tomorrow-2',
      title: 'Creative Project Work',
      date: tomorrowString,
      startTime: '10:30',
      endTime: '12:30',
      category: 'Creative',
      color: '#FF6B35',
      tasks: ['Design new features', 'Create wireframes', 'User research'],
      isActive: false,
      isCompleted: false,
      progress: 0,
    },
    {
      id: 'tomorrow-3',
      title: 'Health & Wellness',
      date: tomorrowString,
      startTime: '18:00',
      endTime: '19:00',
      category: 'Health',
      color: '#B85C38',
      tasks: ['Evening workout', 'Meditation session', 'Meal prep'],
      isActive: false,
      isCompleted: false,
      progress: 0,
    },
  ];
};

const getDefaultCategories = (): BlockCategory[] => [
  { id: '1', name: 'Creative', color: '#FF6B35', icon: 'paintbrush' },
  { id: '2', name: 'Admin', color: '#2E8B8B', icon: 'clipboard' },
  { id: '3', name: 'Personal', color: '#8B4F9F', icon: 'user' },
  { id: '4', name: 'Learning', color: '#4F8B3B', icon: 'book' },
  { id: '5', name: 'Health', color: '#B85C38', icon: 'heart' },
];

const getDefaultReflections = (): DailyReflection[] => {
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  
  return [
    // Yesterday's reflections
    {
      date: yesterdayString,
      blockId: 'yesterday-1',
      blockTitle: 'Morning Planning Session',
      reflection: 'Great way to start the day! Having a clear plan made me feel more focused and productive. I was able to identify my top 3 priorities and felt confident about tackling them.',
      rating: 5,
    },
    {
      date: yesterdayString,
      blockId: 'yesterday-2',
      blockTitle: 'Deep Work - Feature Development',
      reflection: 'Really productive session. I got into a good flow state and made significant progress on the authentication feature. The tests helped me catch a few edge cases early.',
      rating: 4,
    },
    {
      date: yesterdayString,
      blockId: 'yesterday-3',
      blockTitle: 'Learning Session',
      reflection: 'The React Native tutorial was helpful, especially the animation examples. I feel more confident about implementing smooth transitions in the app. Taking notes helped me retain the concepts better.',
      rating: 4,
    },
    
    // Today's reflections (for completed blocks)
    {
      date: today,
      blockId: 'today-1',
      blockTitle: 'Morning Deep Work',
      reflection: 'Excellent focus session! I was able to dive deep into the project requirements and came up with a solid system architecture. The morning is definitely my most productive time.',
      rating: 5,
    },
    {
      date: today,
      blockId: 'today-2',
      blockTitle: 'Team Standup',
      reflection: 'Good team sync. Everyone shared their progress and we identified a few blockers that we can help each other with. The meeting stayed focused and on time.',
      rating: 4,
    },
  ];
};