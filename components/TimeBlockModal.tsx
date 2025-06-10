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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Clock, Tag, Plus, Trash2, Save, Target, Calendar, CheckSquare, Square } from 'lucide-react-native';
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
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory | null>(null);
  const [customColor, setCustomColor] = useState('#FF6B35');
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTask, setNewTask] = useState('');
  const [categories, setCategories] = useState<BlockCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [activeTimeInput, setActiveTimeInput] = useState<'start' | 'end' | null>(null);

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
      setStartTime(editingBlock.startTime);
      setEndTime(editingBlock.endTime);
      setCustomColor(editingBlock.color);
      setTasks(editingBlock.tasks || []);
      
      const category = categories.find(c => c.name === editingBlock.category);
      setSelectedCategory(category || null);
    } else {
      if (initialStartTime) setStartTime(initialStartTime);
      if (initialEndTime) setEndTime(initialEndTime);
    }
  }, [editingBlock, categories, initialStartTime, initialEndTime]);

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
      setStartTime(initialStartTime || '09:00');
      setEndTime(initialEndTime || '10:00');
      setCustomColor('#FF6B35');
      setTasks([]);
      setNewTask('');
      setSelectedCategory(categories[0] || null);
      setErrors({});
    }
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const handleRemoveTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
    setActiveTimeInput(null);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }

    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
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
      const blockData: TimeBlockData = {
        id: editingBlock?.id || Date.now().toString(),
        title: title.trim(),
        startTime,
        endTime,
        category: selectedCategory!.name,
        color: customColor,
        tasks: tasks,
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
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      width: '95%',
      maxHeight: screenHeight * 0.9,
      maxWidth: 500,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 30,
      elevation: 20,
    },
    header: {
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.primary + '10',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      maxHeight: screenHeight * 0.6,
    },
    content: {
      padding: 24,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    titleInput: {
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
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
    timeRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    timeInputContainer: {
      flex: 1,
    },
    timeLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    timeButton: {
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      minHeight: 60,
    },
    timeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    timeText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    timePeriod: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    durationCard: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
      alignItems: 'center',
      alignSelf: 'center',
    },
    durationText: {
      fontSize: 16,
      fontWeight: '700',
      color: 'white',
    },
    timePickerModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timePickerContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '80%',
      maxHeight: 400,
    },
    timePickerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    timeOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 4,
    },
    timeOptionSelected: {
      backgroundColor: colors.primary + '20',
    },
    timeOptionText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
    timeOptionTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.background,
      gap: 8,
    },
    categoryChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    categoryDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    categoryTextSelected: {
      color: colors.primary,
    },
    colorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 12,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: colors.text,
      transform: [{ scale: 1.1 }],
    },
    tasksSection: {
      marginBottom: 24,
    },
    taskInputContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    taskInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 14,
      color: colors.text,
    },
    taskInputFocused: {
      borderColor: colors.primary,
    },
    addTaskButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addTaskButtonDisabled: {
      backgroundColor: colors.textSecondary,
      opacity: 0.5,
    },
    tasksList: {
      gap: 8,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      gap: 12,
    },
    taskText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    removeTaskButton: {
      padding: 4,
    },
    emptyTasksText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      paddingVertical: 20,
    },
    footer: {
      flexDirection: 'row',
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    footerButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
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
      <KeyboardAvoidingView 
        style={styles.modal}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
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
                <View style={styles.sectionTitle}>
                  <Target size={16} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Block Title</Text>
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
                  placeholder="What will you focus on?"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={50}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              </View>

              {/* Time Section */}
              <View style={styles.section}>
                <View style={styles.sectionTitle}>
                  <Clock size={16} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Time & Duration</Text>
                </View>
                
                <View style={styles.timeRow}>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <TouchableOpacity 
                      style={[
                        styles.timeButton,
                        activeTimeInput === 'start' && styles.timeButtonActive
                      ]}
                      onPress={() => setActiveTimeInput('start')}
                    >
                      <Text style={styles.timeText}>
                        {formatTime12Hour(startTime).split(' ')[0]}
                      </Text>
                      <Text style={styles.timePeriod}>
                        {formatTime12Hour(startTime).split(' ')[1]}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>End Time</Text>
                    <TouchableOpacity 
                      style={[
                        styles.timeButton,
                        activeTimeInput === 'end' && styles.timeButtonActive
                      ]}
                      onPress={() => setActiveTimeInput('end')}
                    >
                      <Text style={styles.timeText}>
                        {formatTime12Hour(endTime).split(' ')[0]}
                      </Text>
                      <Text style={styles.timePeriod}>
                        {formatTime12Hour(endTime).split(' ')[1]}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.durationCard}>
                  <Text style={styles.durationText}>{getDuration()}</Text>
                </View>
                
                {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
              </View>

              {/* Category Section */}
              <View style={styles.section}>
                <View style={styles.sectionTitle}>
                  <Tag size={16} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Category</Text>
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

                {/* Color Options */}
                <View style={styles.colorsGrid}>
                  {predefinedColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        customColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setCustomColor(color)}
                    />
                  ))}
                </View>
              </View>

              {/* Tasks Section - REDESIGNED */}
              <View style={styles.tasksSection}>
                <View style={styles.sectionTitle}>
                  <CheckSquare size={16} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Tasks</Text>
                </View>
                
                {/* Add Task Input */}
                <View style={styles.taskInputContainer}>
                  <TextInput
                    style={[
                      styles.taskInput,
                      newTask.length > 0 && styles.taskInputFocused
                    ]}
                    value={newTask}
                    onChangeText={setNewTask}
                    placeholder="Add a task..."
                    placeholderTextColor={colors.textSecondary}
                    maxLength={100}
                    onSubmitEditing={handleAddTask}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[
                      styles.addTaskButton,
                      !newTask.trim() && styles.addTaskButtonDisabled
                    ]}
                    onPress={handleAddTask}
                    disabled={!newTask.trim()}
                  >
                    <Plus size={20} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Tasks List */}
                <View style={styles.tasksList}>
                  {tasks.length > 0 ? (
                    tasks.map((task, index) => (
                      <View key={index} style={styles.taskItem}>
                        <Square size={16} color={colors.textSecondary} />
                        <Text style={styles.taskText}>{task}</Text>
                        <TouchableOpacity
                          style={styles.removeTaskButton}
                          onPress={() => handleRemoveTask(index)}
                        >
                          <Trash2 size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyTasksText}>
                      No tasks added yet. Add tasks to break down your work.
                    </Text>
                  )}
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
              <Save size={16} color="white" />
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {isLoading ? 'Saving...' : editingBlock ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Picker Modal */}
        {activeTimeInput && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => setActiveTimeInput(null)}
          >
            <View style={styles.timePickerModal}>
              <View style={styles.timePickerContent}>
                <Text style={styles.timePickerTitle}>
                  Select {activeTimeInput === 'start' ? 'Start' : 'End'} Time
                </Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {timeOptions.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        (activeTimeInput === 'start' ? startTime : endTime) === time && styles.timeOptionSelected,
                      ]}
                      onPress={() => handleTimeChange(activeTimeInput, time)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          (activeTimeInput === 'start' ? startTime : endTime) === time && styles.timeOptionTextSelected,
                        ]}
                      >
                        {formatTime12Hour(time)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}