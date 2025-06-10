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
import { X, Clock, Tag, Plus, Trash2, Save, Palette, Target, Calendar, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { loadCategories, BlockCategory } from '@/utils/storage';
import { TimeBlockData } from './TimeBlock';
import ClockTimePicker from './ClockTimePicker';

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
      setStartTime(editingBlock.startTime);
      setEndTime(editingBlock.endTime);
      setCustomColor(editingBlock.color);
      setTasks(editingBlock.tasks.length > 0 ? editingBlock.tasks : ['']);
      
      // Find matching category
      const category = categories.find(c => c.name === editingBlock.category);
      setSelectedCategory(category || null);
    } else {
      // Set initial times if provided
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
      setTasks(['']);
      setSelectedCategory(categories[0] || null);
      setErrors({});
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

    // Validate time range
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
      const filteredTasks = tasks.filter(task => task.trim() !== '');
      
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
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
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

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      width: '92%',
      maxHeight: screenHeight * 0.9,
      maxWidth: 500,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.primary + '08',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      padding: 12,
      borderRadius: 20,
      backgroundColor: colors.background,
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
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 10,
    },
    sectionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    sectionDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    titleInput: {
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 18,
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
    },
    titleInputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    titleInputError: {
      borderColor: colors.error,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 6,
      marginLeft: 4,
    },
    timeContainer: {
      gap: 16,
    },
    timeRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-end',
    },
    timePickerContainer: {
      flex: 1,
    },
    durationCard: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '30',
      minWidth: 80,
    },
    durationLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 2,
    },
    durationText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    timePreview: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timePreviewText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.background,
      gap: 8,
      minWidth: 100,
    },
    categoryChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
      transform: [{ scale: 1.02 }],
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
      fontWeight: '700',
    },
    colorsSection: {
      marginTop: 16,
    },
    colorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 12,
    },
    colorOption: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 3,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    colorOptionSelected: {
      borderColor: colors.text,
      transform: [{ scale: 1.1 }],
    },
    colorPreview: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    tasksContainer: {
      gap: 12,
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
      borderRadius: 12,
      padding: 14,
      fontSize: 14,
      color: colors.text,
    },
    taskInputFocused: {
      borderColor: colors.primary,
    },
    taskButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addTaskButton: {
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    removeTaskButton: {
      backgroundColor: colors.error + '20',
      borderWidth: 1,
      borderColor: colors.error + '40',
    },
    addTaskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 12,
      gap: 8,
      backgroundColor: colors.background + '50',
    },
    addTaskText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 16,
      backgroundColor: colors.background + '50',
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    footerButton: {
      flex: 1,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cancelButton: {
      backgroundColor: colors.surface,
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
    validationSummary: {
      backgroundColor: colors.error + '10',
      borderWidth: 1,
      borderColor: colors.error + '30',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    validationTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.error,
      marginBottom: 8,
    },
    validationItem: {
      fontSize: 12,
      color: colors.error,
      marginBottom: 4,
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
            <View>
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

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Validation Errors */}
              {hasErrors && (
                <View style={styles.validationSummary}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <AlertCircle size={16} color={colors.error} />
                    <Text style={[styles.validationTitle, { marginLeft: 8, marginBottom: 0 }]}>
                      Please fix the following issues:
                    </Text>
                  </View>
                  {Object.values(errors).map((error, index) => (
                    <Text key={index} style={styles.validationItem}>• {error}</Text>
                  ))}
                </View>
              )}

              {/* Title Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Target size={16} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Block Title</Text>
                    <Text style={styles.sectionDescription}>What will you focus on?</Text>
                  </View>
                </View>
                <View style={styles.inputContainer}>
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
              </View>

              {/* Time Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.secondary + '20' }]}>
                    <Clock size={16} color={colors.secondary} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Time & Duration</Text>
                    <Text style={styles.sectionDescription}>When will this happen?</Text>
                  </View>
                </View>
                <View style={styles.timeContainer}>
                  <View style={styles.timeRow}>
                    <View style={styles.timePickerContainer}>
                      <ClockTimePicker
                        value={startTime}
                        onTimeChange={(time) => {
                          setStartTime(time);
                          if (errors.time) {
                            const newErrors = { ...errors };
                            delete newErrors.time;
                            setErrors(newErrors);
                          }
                        }}
                        label="Start Time"
                      />
                    </View>
                    <View style={styles.timePickerContainer}>
                      <ClockTimePicker
                        value={endTime}
                        onTimeChange={(time) => {
                          setEndTime(time);
                          if (errors.time) {
                            const newErrors = { ...errors };
                            delete newErrors.time;
                            setErrors(newErrors);
                          }
                        }}
                        label="End Time"
                      />
                    </View>
                    <View style={styles.durationCard}>
                      <Text style={styles.durationLabel}>DURATION</Text>
                      <Text style={styles.durationText}>{getDuration()}</Text>
                    </View>
                  </View>
                  <View style={styles.timePreview}>
                    <Text style={styles.timePreviewText}>
                      📅 {formatTime12Hour(startTime)} - {formatTime12Hour(endTime)}
                    </Text>
                  </View>
                  {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
                </View>
              </View>

              {/* Category Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.accent + '20' }]}>
                    <Tag size={16} color={colors.accent} />
                  </View>
                  <View>
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
                  <Text style={styles.inputLabel}>Custom Color</Text>
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

              {/* Tasks Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.success + '20' }]}>
                    <Calendar size={16} color={colors.success} />
                  </View>
                  <View>
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
                <>
                  <Text style={[styles.buttonText, styles.saveButtonText]}>Saving...</Text>
                </>
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