import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeBlockData } from '@/components/TimeBlock';

const BLOCKS_KEY = 'timeBlocks';
const CATEGORIES_KEY = 'blockCategories';
const REFLECTIONS_KEY = 'dailyReflections';

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

// Time Blocks
export const saveTimeBlocks = async (blocks: TimeBlockData[]) => {
  try {
    await AsyncStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
  } catch (error) {
    console.error('Error saving time blocks:', error);
  }
};

export const loadTimeBlocks = async (): Promise<TimeBlockData[]> => {
  try {
    const blocks = await AsyncStorage.getItem(BLOCKS_KEY);
    return blocks ? JSON.parse(blocks) : getDefaultBlocks();
  } catch (error) {
    console.error('Error loading time blocks:', error);
    return getDefaultBlocks();
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

// Default data
const getDefaultBlocks = (): TimeBlockData[] => [
  {
    id: '1',
    title: 'Morning Deep Work',
    startTime: '09:00',
    endTime: '11:00',
    category: 'Creative',
    color: '#FF6B35',
    tasks: ['Review project requirements', 'Design system architecture'],
    isActive: false,
    isCompleted: false,
    progress: 0,
  },
  {
    id: '2',
    title: 'Team Standup',
    startTime: '11:00',
    endTime: '11:30',
    category: 'Admin',
    color: '#2E8B8B',
    tasks: ['Share yesterday progress', 'Discuss blockers'],
    isActive: true,
    isCompleted: false,
    progress: 60,
  },
  {
    id: '3',
    title: 'Focused Coding',
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
    id: '4',
    title: 'Email & Communications',
    startTime: '15:00',
    endTime: '15:30',
    category: 'Admin',
    color: '#2E8B8B',
    tasks: ['Reply to client emails', 'Update project status'],
    isActive: false,
    isCompleted: true,
    progress: 100,
  },
];

const getDefaultCategories = (): BlockCategory[] => [
  { id: '1', name: 'Creative', color: '#FF6B35', icon: 'paintbrush' },
  { id: '2', name: 'Admin', color: '#2E8B8B', icon: 'clipboard' },
  { id: '3', name: 'Personal', color: '#8B4F9F', icon: 'user' },
  { id: '4', name: 'Learning', color: '#4F8B3B', icon: 'book' },
  { id: '5', name: 'Health', color: '#B85C38', icon: 'heart' },
];