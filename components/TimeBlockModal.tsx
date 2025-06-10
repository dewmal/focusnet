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
import { X, Clock, Tag, Plus, Trash2, Save, Target, Calendar, ChevronDown } from 'lucide-react-native';
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
  const [selectedDuration, setSelectedDuration] = useState(60); // in minutes
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory | null>(null);
  const [customColor, setCustomColor] = useState('#FF6B35');
  const [tasks, setTasks] = useState<string[]>(['']);
  const [categories, setCategories] = useState<BlockCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Dropdown states
  const [showHourDropdown, setShowHourDropdown] = useState(false);
  const [showMinuteDropdown, setShowMinuteDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);

  const predefinedColors = [
    '#FF6B35', '#2E8B8B', '#8B4F9F', '#4F8B3B', 
    '#B85C38', '#6B4E7D', '#7D6B4E', '#FF4444',
    '#FFB800', '#4CAF50', '#2196F3', '#9C27B0'
  ];

  const durationOptions = [
    { value: 15, label: '15m' },
    { value: 30, label: '30m' },
    { value: 45, label: '45m' },
    { value: 60, label: '1h' },
    { value: 90, label: '1h 30m' },
    { value: 120, label: '2h' },
    { value: 180, label: '3h' },
    { value: 240, label: '4h' }
  ];

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const periods = ['AM', 'PM'];

  useEffect(() => {
    if (visible) {
      loadCategoriesData();
      resetForm();
    }
  }, [visible]);

  useEffect(() => {
    if (editingBlock) {
      setTitle(editingBlock.title);
      parseStartTime(editingBlock.startTime);
      calculateDurationFromTimes(editingBlock.startTime, editingBlock.endTime);
      setCustomColor(editingBlock.color);
      setTasks(editingBlock.tasks.length > 0 ? editingBlock.tasks : ['']);
      
      const category = categories.find(c => c.name === editingBlock.category);
      setSelectedCategory(category || null);
    } else {
      if (initialStartTime) parseStartTime(initialStartTime);
    }
  }, [editingBlock, categories, initialStartTime]);

  const parseStartTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    setStartHour(displayHour);
    setStartMinute(minute);
    setStartPeriod(period);
  };

  const calculateDurationFromTimes = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    setSelectedDuration(durationMinutes);
  };

  const formatTimeTo24Hour = (hour: number, minute: number, period: 'AM' | 'PM') => {
    let hour24 = hour;
    if (period === 'AM' && hour === 12) hour24 = 0;
    if (period === 'PM' && hour !== 12) hour24 = hour + 12;
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatTime12Hour = (hour: number, minute: number, period: 'AM' | 'PM') => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const calculateEndTime = () => {
    const startTime24 = formatTimeTo24Hour(startHour, startMinute, startPeriod);
    const start = new Date(`2000-01-01 ${startTime24}`);
    const end = new Date(start.getTime() + selectedDuration * 60000);
    
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    const endPeriod = endHour >= 12 ? 'PM' : 'AM';
    const displayEndHour = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
    
    return formatTime12Hour(displayEndHour, endMinute, endPeriod);
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
      setSelectedDuration(60);
      setCustomColor('#FF6B35');
      setTasks(['']);
      setSelectedCategory(categories[0] || null);
      setErrors({});
    }
  };

  const closeAllDropdowns = () => {
    setShowHourDropdown(false);
    setShowMinuteDropdown(false);
    setShowPeriodDropdown(false);
    setShowDurationDropdown(false);
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

    if (selectedDuration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes';
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
      
      // Calculate end time based on duration
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(start.getTime() + selectedDuration * 60000);
      const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
      
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  const Dropdown = ({ 
    visible, 
    onClose, 
    options, 
    onSelect, 
    selectedValue,
    style = {}
  }: {
    visible: boolean;
    onClose: () => void;
    options: any[];
    onSelect: (value: any) => void;
    selectedValue: any;
    style?: any;
  }) => {
    if (!visible) return null;

    return (
      <View style={[styles.dropdown, style]}>
        <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
          {options.map((option, index) => {
            const value = typeof option === 'object' ? option.value : option;
            const label = typeof option === 'object' ? option.label : option.toString().padStart(2, '0');
            const isSelected = selectedValue === value;
            
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                onPress={() => {
                  onSelect(value);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dropdownOptionText,
                  isSelected && styles.dropdownOptionTextSelected
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

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
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    taskButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
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
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 16,
      gap: 10,
      backgroundColor: colors.background,
    },
    addTaskText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    durationContainer: {
      gap: 20,
    },
    timeRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    timeDropdownContainer: {
      flex: 1,
      position: 'relative',
    },
    timeDropdownButton: {
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 56,
    },
    timeDropdownButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    timeDropdownLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 8,
    },
    timeDropdownValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    durationDropdownContainer: {
      position: 'relative',
      marginBottom: 20,
    },
    durationDropdownButton: {
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    durationDropdownButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    durationDropdownValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      maxHeight: 200,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    dropdownScroll: {
      maxHeight: 200,
    },
    dropdownOption: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownOptionSelected: {
      backgroundColor: colors.primary + '20',
    },
    dropdownOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    dropdownOptionTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
    endTimeDisplay: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      alignSelf: 'center',
    },
    endTimeLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: 'white',
      marginBottom: 4,
      letterSpacing: 1,
    },
    endTimeText: {
      fontSize: 18,
      fontWeight: '800',
      color: 'white',
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modal} 
        activeOpacity={1} 
        onPress={closeAllDropdowns}
      >
        <TouchableOpacity 
          style={styles.modalContent} 
          activeOpacity={1} 
          onPress={() => {}}
        >
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
              {/* 1. Title Section */}
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

              {/* 2. Tasks Section */}
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
                        placeholderTextColor={colors.textSecondary}
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
                      <Plus size={16} color={colors.textSecondary} />
                      <Text style={styles.addTaskText}>Add another task</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* 3. Duration Section - REDESIGNED WITH DROPDOWNS */}
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
                
                <View style={styles.durationContainer}>
                  {/* Start Time Selection with Dropdowns */}
                  <View style={styles.timeRow}>
                    {/* Hour Dropdown */}
                    <View style={styles.timeDropdownContainer}>
                      <Text style={styles.timeDropdownLabel}>Hour</Text>
                      <TouchableOpacity 
                        style={[
                          styles.timeDropdownButton,
                          showHourDropdown && styles.timeDropdownButtonActive
                        ]}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowHourDropdown(!showHourDropdown);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.timeDropdownValue}>
                          {startHour.toString().padStart(2, '0')}
                        </Text>
                        <ChevronDown size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <Dropdown
                        visible={showHourDropdown}
                        onClose={() => setShowHourDropdown(false)}
                        options={hours}
                        onSelect={setStartHour}
                        selectedValue={startHour}
                      />
                    </View>

                    {/* Minute Dropdown */}
                    <View style={styles.timeDropdownContainer}>
                      <Text style={styles.timeDropdownLabel}>Minute</Text>
                      <TouchableOpacity 
                        style={[
                          styles.timeDropdownButton,
                          showMinuteDropdown && styles.timeDropdownButtonActive
                        ]}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowMinuteDropdown(!showMinuteDropdown);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.timeDropdownValue}>
                          {startMinute.toString().padStart(2, '0')}
                        </Text>
                        <ChevronDown size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <Dropdown
                        visible={showMinuteDropdown}
                        onClose={() => setShowMinuteDropdown(false)}
                        options={minutes}
                        onSelect={setStartMinute}
                        selectedValue={startMinute}
                      />
                    </View>

                    {/* Period Dropdown */}
                    <View style={styles.timeDropdownContainer}>
                      <Text style={styles.timeDropdownLabel}>Period</Text>
                      <TouchableOpacity 
                        style={[
                          styles.timeDropdownButton,
                          showPeriodDropdown && styles.timeDropdownButtonActive
                        ]}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowPeriodDropdown(!showPeriodDropdown);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.timeDropdownValue}>{startPeriod}</Text>
                        <ChevronDown size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <Dropdown
                        visible={showPeriodDropdown}
                        onClose={() => setShowPeriodDropdown(false)}
                        options={periods}
                        onSelect={setStartPeriod}
                        selectedValue={startPeriod}
                      />
                    </View>
                  </View>
                  
                  {/* Duration Dropdown */}
                  <View style={styles.durationDropdownContainer}>
                    <Text style={styles.timeDropdownLabel}>Duration</Text>
                    <TouchableOpacity 
                      style={[
                        styles.durationDropdownButton,
                        showDurationDropdown && styles.durationDropdownButtonActive
                      ]}
                      onPress={() => {
                        closeAllDropdowns();
                        setShowDurationDropdown(!showDurationDropdown);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.durationDropdownValue}>
                        {durationOptions.find(d => d.value === selectedDuration)?.label || formatDuration(selectedDuration)}
                      </Text>
                      <ChevronDown size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Dropdown
                      visible={showDurationDropdown}
                      onClose={() => setShowDurationDropdown(false)}
                      options={durationOptions}
                      onSelect={setSelectedDuration}
                      selectedValue={selectedDuration}
                    />
                  </View>
                  
                  {/* End Time Display */}
                  <View style={styles.endTimeDisplay}>
                    <Text style={styles.endTimeLabel}>ENDS AT</Text>
                    <Text style={styles.endTimeText}>{calculateEndTime()}</Text>
                  </View>
                  
                  {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
                </View>
              </View>

              {/* 4. Category Section */}
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
                      activeOpacity={0.7}
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
              </View>

              {/* 5. Color Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '30' }]}>
                    <Target size={18} color={colors.primary} />
                  </View>
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Custom Color</Text>
                    <Text style={styles.sectionDescription}>Choose a color for this block</Text>
                  </View>
                </View>
                <View style={styles.colorsGrid}>
                  {predefinedColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        customColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setCustomColor(color)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[styles.colorPreview, { backgroundColor: color }]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}
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
              activeOpacity={0.8}
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
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}