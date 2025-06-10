import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { X, Clock, Tag, Plus, Trash2, Save, Target, Calendar, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { loadCategories, BlockCategory } from '@/utils/storage';
import { TimeBlockData } from './TimeBlock';

interface TimeBlockModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (block: TimeBlockData) => void;
  editingBlock?: TimeBlockData | null;
  initialStartTime?: string;
  initialEndTime?: string;
}

const screenHeight = Dimensions.get('window').height;

export default function TimeBlockModal({
  visible,
  onClose,
  onSave,
  editingBlock,
  initialStartTime,
  initialEndTime,
}: TimeBlockModalProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('AM');
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(0);
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('AM');
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory | null>(null);
  const [customColor, setCustomColor] = useState('#FF6B35');
  const [tasks, setTasks] = useState<string[]>(['']);
  const [categories, setCategories] = useState<BlockCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const predefinedColors = [
    '#FF6B35', '#2E8B8B', '#8B4F9F', '#4F8B3B', 
    '#B85C38', '#6B4E7D', '#7D6B4E', '#FF4444',
    '#FFB800', '#4CAF50', '#2196F3', '#9C27B0'
  ];

  useEffect(() => {
    if (visible) {
      loadCategoriesData();
      resetForm();
    }
  }, [visible]);

  useEffect(() => {
    if (editingBlock) {
      setTitle(editingBlock.title);
      parseTime(editingBlock.startTime, 'start');
      parseTime(editingBlock.endTime, 'end');
      setCustomColor(editingBlock.color);
      setTasks(editingBlock.tasks.length > 0 ? editingBlock.tasks : ['']);
      
      const category = categories.find(c => c.name === editingBlock.category);
      setSelectedCategory(category || null);
    } else {
      if (initialStartTime) parseTime(initialStartTime, 'start');
      if (initialEndTime) parseTime(initialEndTime, 'end');
    }
  }, [editingBlock, categories, initialStartTime, initialEndTime]);

  const parseTime = (timeString: string, type: 'start' | 'end') => {
    const [hour, minute] = timeString.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    if (type === 'start') {
      setStartHour(displayHour);
      setStartMinute(minute);
      setStartPeriod(period);
    } else {
      setEndHour(displayHour);
      setEndMinute(minute);
      setEndPeriod(period);
    }
  };

  const formatTimeTo24Hour = (hour: number, minute: number, period: 'AM' | 'PM') => {
    let hour24 = hour;
    if (period === 'AM' && hour === 12) hour24 = 0;
    if (period === 'PM' && hour !== 12) hour24 = hour + 12;
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const loadCategoriesData = async () => {
    try {
      const savedCategories = await loadCategories();
      setCategories(savedCategories);
      if (!selectedCategory && savedCategories.length > 0) {
        setSelectedCategory(savedCategories[0]);
        setCustomColor(savedCategories[0].color);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const resetForm = () => {
    if (!editingBlock) {
      setTitle('');
      setStartHour(9);
      setStartMinute(0);
      setStartPeriod('AM');
      setEndHour(10);
      setEndMinute(0);
      setEndPeriod('AM');
      setCustomColor('#FF6B35');
      setTasks(['']);
      setSelectedCategory(categories[0] || null);
      setErrors({});
    }
  };

  const adjustTime = (type: 'start' | 'end', component: 'hour' | 'minute', direction: 'up' | 'down') => {
    const isStart = type === 'start';
    const currentHour = isStart ? startHour : endHour;
    const currentMinute = isStart ? startMinute : endMinute;
    
    let newHour = currentHour;
    let newMinute = currentMinute;

    if (component === 'hour') {
      if (direction === 'up') {
        newHour = currentHour === 12 ? 1 : currentHour + 1;
      } else {
        newHour = currentHour === 1 ? 12 : currentHour - 1;
      }
    } else {
      if (direction === 'up') {
        newMinute = currentMinute === 55 ? 0 : currentMinute + 5;
      } else {
        newMinute = currentMinute === 0 ? 55 : currentMinute - 5;
      }
    }

    if (isStart) {
      setStartHour(newHour);
      setStartMinute(newMinute);
    } else {
      setEndHour(newHour);
      setEndMinute(newMinute);
    }
  };

  const handleAddTask = () => {
    if (tasks.length < 5) {
      setTasks([...tasks, '']);
    }
  };

  const handleRemoveTask = (index: number) => {
    if (tasks.length > 1) {
      const newTasks = tasks.filter((_, i) => i !== index);
      setTasks(newTasks);
    }
  };

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }

    const startTime24 = formatTimeTo24Hour(startHour, startMinute, startPeriod);
    const endTime24 = formatTimeTo24Hour(endHour, endMinute, endPeriod);
    const start = new Date(`2000-01-01 ${startTime24}`);
    const end = new Date(`2000-01-01 ${endTime24}`);
    
    if (end <= start) {
      newErrors.time = 'End time must be after start time';
    }

    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    if (duration < 15) {
      newErrors.time = 'Time block must be at least 15 minutes long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const filteredTasks = tasks.filter(task => task.trim() !== '');
      const startTime = formatTimeTo24Hour(startHour, startMinute, startPeriod);
      const endTime = formatTimeTo24Hour(endHour, endMinute, endPeriod);
      
      const blockData: TimeBlockData = {
        id: editingBlock?.id || Date.now().toString(),
        title: title.trim(),
        startTime,
        endTime,
        category: selectedCategory!.name,
        color: customColor,
        tasks: filteredTasks,
        isActive: editingBlock?.isActive || false,
        isCompleted: editingBlock?.isCompleted || false,
        progress: editingBlock?.progress || 0,
      };

      await onSave(blockData);
      onClose();
      
      Alert.alert(
        'Success',
        editingBlock ? 'Time block updated successfully!' : 'Time block created successfully!'
      );
    } catch (error) {
      console.error('Error saving time block:', error);
      Alert.alert('Error', 'Failed to save time block. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDuration = () => {
    const startTime24 = formatTimeTo24Hour(startHour, startMinute, startPeriod);
    const endTime24 = formatTimeTo24Hour(endHour, endMinute, endPeriod);
    const start = new Date(`2000-01-01 ${startTime24}`);
    const end = new Date(`2000-01-01 ${endTime24}`);
    const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  const TimePickerComponent = ({ 
    type, 
    hour, 
    minute, 
    period, 
    label 
  }: { 
    type: 'start' | 'end';
    hour: number;
    minute: number;
    period: 'AM' | 'PM';
    label: string;
  }) => (
    <View style={styles.timePickerContainer}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <View style={styles.timePickerRow}>
        {/* Hour Picker */}
        <View style={styles.timeComponent}>
          <TouchableOpacity 
            style={styles.timeButton}
            onPress={() => adjustTime(type, 'hour', 'up')}
          >
            <ChevronUp size={16} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{hour.toString().padStart(2, '0')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.timeButton}
            onPress={() => adjustTime(type, 'hour', 'down')}
          >
            <ChevronDown size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.timeSeparator}>:</Text>

        {/* Minute Picker */}
        <View style={styles.timeComponent}>
          <TouchableOpacity 
            style={styles.timeButton}
            onPress={() => adjustTime(type, 'minute', 'up')}
          >
            <ChevronUp size={16} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{minute.toString().padStart(2, '0')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.timeButton}
            onPress={() => adjustTime(type, 'minute', 'down')}
          >
            <ChevronDown size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Period Toggle */}
        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'AM' && styles.periodButtonActive]}
            onPress={() => {
              if (type === 'start') setStartPeriod('AM');
              else setEndPeriod('AM');
            }}
          >
            <Text style={[styles.periodText, period === 'AM' && styles.periodTextActive]}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'PM' && styles.periodButtonActive]}
            onPress={() => {
              if (type === 'start') setStartPeriod('PM');
              else setEndPeriod('PM');
            }}
          >
            <Text style={[styles.periodText, period === 'PM' && styles.periodTextActive]}>PM</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      width: '94%',
      maxHeight: screenHeight * 0.92,
      maxWidth: 520,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.5,
      shadowRadius: 30,
      elevation: 20,
    },
    header: {
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerContent: {
      flex: 1,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    scrollView: {
      maxHeight: screenHeight * 0.55,
    },
    content: {
      padding: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    sectionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionContent: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    sectionDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    titleInput: {
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      fontSize: 18,
      color: colors.text,
      fontWeight: '600',
    },
    titleInputFocused: {
      borderColor: colors.primary,
    },
    titleInputError: {
      borderColor: colors.error,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 8,
      marginLeft: 4,
      fontWeight: '500',
    },
    timeContainer: {
      gap: 20,
    },
    timePickerContainer: {
      marginBottom: 20,
    },
    timePickerLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
      textAlign: 'center',
    },
    timePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    timeComponent: {
      alignItems: 'center',
      backgroundColor: '#2A2A2A',
      borderRadius: 12,
      padding: 8,
      borderWidth: 1,
      borderColor: '#404040',
    },
    timeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: '#1A1A1A',
    },
    timeDisplay: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      minWidth: 40,
      alignItems: 'center',
    },
    timeText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    timeSeparator: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
      marginHorizontal: 4,
    },
    periodContainer: {
      flexDirection: 'column',
      gap: 4,
    },
    periodButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: '#1A1A1A',
      borderWidth: 1,
      borderColor: '#404040',
      alignItems: 'center',
      minWidth: 40,
    },
    periodButtonActive: {
      backgroundColor: '#FF6B35',
      borderColor: '#FF6B35',
    },
    periodText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#B0B0B0',
    },
    periodTextActive: {
      color: 'white',
    },
    durationCard: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      alignSelf: 'center',
      marginTop: 16,
    },
    durationLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: 'white',
      marginBottom: 4,
      letterSpacing: 1,
    },
    durationText: {
      fontSize: 18,
      fontWeight: '800',
      color: 'white',
    },
    categoriesContainer: {
      marginBottom: 24,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.background,
      gap: 10,
      minWidth: 120,
    },
    categoryChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    categoryDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    categoryTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
    colorsSection: {
      marginTop: 20,
    },
    colorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 16,
    },
    colorOption: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 3,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    colorOptionSelected: {
      borderColor: colors.text,
      transform: [{ scale: 1.15 }],
    },
    colorPreview: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    tasksContainer: {
      gap: 16,
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    taskInput: {
      flex: 1,
      backgroundColor: '#2A2A2A',
      borderWidth: 2,
      borderColor: '#404040',
      borderRadius: 16,
      padding: 16,
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    taskInputFocused: {
      borderColor: colors.primary,
    },
    taskButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addTaskButton: {
      backgroundColor: colors.primary + '30',
      borderWidth: 2,
      borderColor: colors.primary + '60',
    },
    removeTaskButton: {
      backgroundColor: colors.error + '30',
      borderWidth: 2,
      borderColor: colors.error + '60',
    },
    addTaskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      borderWidth: 2,
      borderColor: '#404040',
      borderStyle: 'dashed',
      borderRadius: 16,
      gap: 10,
      backgroundColor: '#2A2A2A',
    },
    addTaskText: {
      fontSize: 14,
      color: '#B0B0B0',
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 16,
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    footerButton: {
      flex: 1,
      paddingVertical: 20,
      borderRadius: 20,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    saveButtonDisabled: {
      backgroundColor: colors.textSecondary,
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
    },
    cancelButtonText: {
      color: colors.textSecondary,
    },
    saveButtonText: {
      color: 'white',
    },
  });

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>
                  {editingBlock ? 'Edit Time Block' : 'Create Time Block'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {editingBlock ? 'Modify your existing block' : 'Plan your focused work session'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Title Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '30' }]}>
                    <Target size={18} color={colors.primary} />
                  </View>
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Block Title</Text>
                    <Text style={styles.sectionDescription}>What will you focus on?</Text>
                  </View>
                </View>
                <TextInput
                  style={[
                    styles.titleInput,
                    errors.title && styles.titleInputError
                  ]}
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    if (errors.title) {
                      const newErrors = { ...errors };
                      delete newErrors.title;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="Enter a descriptive title..."
                  placeholderTextColor={colors.textSecondary}
                  maxLength={50}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              </View>

              {/* Time Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '30' }]}>
                    <Clock size={18} color={colors.primary} />
                  </View>
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Time & Duration</Text>
                    <Text style={styles.sectionDescription}>When will this happen?</Text>
                  </View>
                </View>
                
                <View style={styles.timeContainer}>
                  <TimePickerComponent
                    type="start"
                    hour={startHour}
                    minute={startMinute}
                    period={startPeriod}
                    label="Start Time"
                  />
                  
                  <TimePickerComponent
                    type="end"
                    hour={endHour}
                    minute={endMinute}
                    period={endPeriod}
                    label="End Time"
                  />
                  
                  <View style={styles.durationCard}>
                    <Text style={styles.durationLabel}>DURATION</Text>
                    <Text style={styles.durationText}>{getDuration()}</Text>
                  </View>
                  
                  {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
                </View>
              </View>

              {/* Tasks Section - Moved after title */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '30' }]}>
                    <Calendar size={18} color={colors.primary} />
                  </View>
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Tasks</Text>
                    <Text style={styles.sectionDescription}>What specific tasks will you complete?</Text>
                  </View>
                </View>
                <View style={styles.tasksContainer}>
                  {tasks.map((task, index) => (
                    <View key={index} style={styles.taskRow}>
                      <TextInput
                        style={styles.taskInput}
                        value={task}
                        onChangeText={(value) => handleTaskChange(index, value)}
                        placeholder={`Task ${index + 1}...`}
                        placeholderTextColor="#666666"
                        maxLength={100}
                      />
                      {tasks.length > 1 && (
                        <TouchableOpacity
                          style={[styles.taskButton, styles.removeTaskButton]}
                          onPress={() => handleRemoveTask(index)}
                        >
                          <Trash2 size={16} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  
                  {tasks.length < 5 && (
                    <TouchableOpacity style={styles.addTaskRow} onPress={handleAddTask}>
                      <Plus size={16} color="#B0B0B0" />
                      <Text style={styles.addTaskText}>Add another task</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Category Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '30' }]}>
                    <Tag size={18} color={colors.primary} />
                  </View>
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Category</Text>
                    <Text style={styles.sectionDescription}>What type of work is this?</Text>
                  </View>
                </View>
                <View style={styles.categoriesGrid}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        selectedCategory?.id === category.id && styles.categoryChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedCategory(category);
                        setCustomColor(category.color);
                        if (errors.category) {
                          const newErrors = { ...errors };
                          delete newErrors.category;
                          setErrors(newErrors);
                        }
                      }}
                    >
                      <View
                        style={[styles.categoryDot, { backgroundColor: category.color }]}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategory?.id === category.id && styles.categoryTextSelected,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

                {/* Color Customization */}
                <View style={styles.colorsSection}>
                  <Text style={styles.sectionTitle}>Custom Color</Text>
                  <View style={styles.colorsGrid}>
                    {predefinedColors.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          customColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setCustomColor(color)}
                      >
                        <View
                          style={[styles.colorPreview, { backgroundColor: color }]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.saveButton,
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={[styles.buttonText, styles.saveButtonText]}>Saving...</Text>
              ) : (
                <>
                  <Save size={16} color="white" />
                  <Text style={[styles.buttonText, styles.saveButtonText]}>
                    {editingBlock ? 'Update Block' : 'Create Block'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}