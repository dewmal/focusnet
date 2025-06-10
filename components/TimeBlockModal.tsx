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
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [timePickerType, setTimePickerType] = useState<'start' | 'end'>('start');

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

  const formatTime12Hour = (hour: number, minute: number, period: 'AM' | 'PM') => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
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

  const openTimePicker = (type: 'start' | 'end') => {
    setTimePickerType(type);
    setShowTimePickerModal(true);
  };

  const adjustTime = (component: 'hour' | 'minute', direction: 'up' | 'down') => {
    const isStart = timePickerType === 'start';
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

  const togglePeriod = () => {
    if (timePickerType === 'start') {
      setStartPeriod(startPeriod === 'AM' ? 'PM' : 'AM');
    } else {
      setEndPeriod(endPeriod === 'AM' ? 'PM' : 'AM');
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

  const TimePickerModal = () => {
    const currentHour = timePickerType === 'start' ? startHour : endHour;
    const currentMinute = timePickerType === 'start' ? startMinute : endMinute;
    const currentPeriod = timePickerType === 'start' ? startPeriod : endPeriod;

    return (
      <Modal
        visible={showTimePickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePickerModal(false)}
      >
        <View style={styles.timePickerModalOverlay}>
          <View style={styles.timePickerModalContent}>
            <View style={styles.timePickerHeader}>
              <Text style={styles.timePickerTitle}>
                Select {timePickerType === 'start' ? 'Start' : 'End'} Time
              </Text>
              <TouchableOpacity
                style={styles.timePickerCloseButton}
                onPress={() => setShowTimePickerModal(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerDisplay}>
              <Text style={styles.timePickerDisplayText}>
                {formatTime12Hour(currentHour, currentMinute, currentPeriod)}
              </Text>
            </View>

            <View style={styles.timePickerControls}>
              {/* Hour Control */}
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerColumnLabel}>Hour</Text>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => adjustTime('hour', 'up')}
                  activeOpacity={0.7}
                >
                  <ChevronUp size={20} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.timePickerValue}>
                  <Text style={styles.timePickerValueText}>
                    {currentHour.toString().padStart(2, '0')}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => adjustTime('hour', 'down')}
                  activeOpacity={0.7}
                >
                  <ChevronDown size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.timePickerSeparatorContainer}>
                <Text style={styles.timePickerSeparator}>:</Text>
              </View>

              {/* Minute Control */}
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerColumnLabel}>Minute</Text>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => adjustTime('minute', 'up')}
                  activeOpacity={0.7}
                >
                  <ChevronUp size={20} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.timePickerValue}>
                  <Text style={styles.timePickerValueText}>
                    {currentMinute.toString().padStart(2, '0')}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => adjustTime('minute', 'down')}
                  activeOpacity={0.7}
                >
                  <ChevronDown size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Period Control */}
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerColumnLabel}>Period</Text>
                <View style={styles.timePickerPeriodContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.timePickerPeriodButton,
                      currentPeriod === 'AM' && styles.timePickerPeriodButtonActive
                    ]}
                    onPress={() => {
                      if (timePickerType === 'start') {
                        setStartPeriod('AM');
                      } else {
                        setEndPeriod('AM');
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.timePickerPeriodText,
                      currentPeriod === 'AM' && styles.timePickerPeriodTextActive
                    ]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.timePickerPeriodButton,
                      currentPeriod === 'PM' && styles.timePickerPeriodButtonActive
                    ]}
                    onPress={() => {
                      if (timePickerType === 'start') {
                        setStartPeriod('PM');
                      } else {
                        setEndPeriod('PM');
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.timePickerPeriodText,
                      currentPeriod === 'PM' && styles.timePickerPeriodTextActive
                    ]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.timePickerConfirmButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowTimePickerModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.timePickerConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    timeContainer: {
      gap: 20,
    },
    timeDurationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    timeButton: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    timeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    timeButtonLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 8,
    },
    timeButtonValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    timeSeparator: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textSecondary,
      marginTop: 20,
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
    // Time Picker Modal Styles - REDESIGNED
    timePickerModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'flex-end',
    },
    timePickerModalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    timePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    timePickerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    timePickerCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timePickerDisplay: {
      alignItems: 'center',
      marginBottom: 32,
      paddingVertical: 24,
      backgroundColor: colors.background,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.primary + '30',
    },
    timePickerDisplayText: {
      fontSize: 42,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 2,
    },
    timePickerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 32,
      paddingHorizontal: 20,
    },
    timePickerColumn: {
      alignItems: 'center',
      flex: 1,
    },
    timePickerColumnLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 16,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    timePickerButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      marginBottom: 8,
    },
    timePickerValue: {
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: colors.primary,
      minWidth: 70,
      alignItems: 'center',
      marginVertical: 8,
    },
    timePickerValueText: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    timePickerSeparatorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 60,
    },
    timePickerSeparator: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    timePickerPeriodContainer: {
      gap: 8,
      marginTop: 16,
    },
    timePickerPeriodButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      minWidth: 60,
    },
    timePickerPeriodButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timePickerPeriodText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    timePickerPeriodTextActive: {
      color: 'white',
    },
    timePickerConfirmButton: {
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    timePickerConfirmText: {
      fontSize: 18,
      fontWeight: '700',
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

              {/* 3. Duration Section */}
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
                  <View style={styles.timeDurationRow}>
                    <TouchableOpacity 
                      style={styles.timeButton}
                      onPress={() => openTimePicker('start')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timeButtonLabel}>Start Time</Text>
                      <Text style={styles.timeButtonValue}>
                        {formatTime12Hour(startHour, startMinute, startPeriod)}
                      </Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.timeSeparator}>|</Text>
                    
                    <TouchableOpacity 
                      style={styles.timeButton}
                      onPress={() => openTimePicker('end')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.timeButtonLabel}>End Time</Text>
                      <Text style={styles.timeButtonValue}>
                        {formatTime12Hour(endHour, endMinute, endPeriod)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.durationCard}>
                    <Text style={styles.durationLabel}>DURATION</Text>
                    <Text style={styles.durationText}>{getDuration()}</Text>
                  </View>
                  
                  {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
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
        </View>
      </View>

      {/* Time Picker Modal */}
      <TimePickerModal />
    </Modal>
  );
}