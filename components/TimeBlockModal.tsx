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

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#2A2A2A',
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
      borderBottomColor: '#404040',
      backgroundColor: '#333333',
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
      color: '#FFFFFF',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#B0B0B0',
      fontWeight: '500',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#404040',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#555555',
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
      color: '#FFFFFF',
      marginBottom: 2,
    },
    sectionDescription: {
      fontSize: 13,
      color: '#B0B0B0',
      fontWeight: '500',
    },
    titleInput: {
      backgroundColor: '#1A1A1A',
      borderWidth: 2,
      borderColor: '#404040',
      borderRadius: 16,
      padding: 20,
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    titleInputFocused: {
      borderColor: '#FF6B35',
      backgroundColor: '#2A2A2A',
    },
    titleInputError: {
      borderColor: '#FF4444',
    },
    errorText: {
      fontSize: 12,
      color: '#FF4444',
      marginTop: 8,
      marginLeft: 4,
      fontWeight: '500',
    },
    timeContainer: {
      gap: 20,
    },
    timeSection: {
      marginBottom: 24,
    },
    timeSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#B0B0B0',
      marginBottom: 16,
      textAlign: 'center',
    },
    timeRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 20,
    },
    timePickerWrapper: {
      flex: 1,
    },
    timePickerLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#B0B0B0',
      marginBottom: 8,
    },
    timePickerButton: {
      backgroundColor: '#1A1A1A',
      borderWidth: 2,
      borderColor: '#FF6B35',
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 80,
    },
    timePickerButtonActive: {
      backgroundColor: '#FF6B35',
      borderColor: '#FF6B35',
    },
    timePickerTime: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FF6B35',
      marginBottom: 4,
    },
    timePickerTimeActive: {
      color: '#FFFFFF',
    },
    timePickerPeriod: {
      fontSize: 12,
      fontWeight: '600',
      color: '#B0B0B0',
      letterSpacing: 1,
    },
    timePickerPeriodActive: {
      color: '#FFFFFF',
    },
    durationCard: {
      backgroundColor: '#FF6B35',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderRadius: 16,
      alignItems: 'center',
      minWidth: 100,
      alignSelf: 'center',
      marginTop: 16,
    },
    durationLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 4,
      letterSpacing: 1,
    },
    durationText: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
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
      borderColor: '#404040',
      backgroundColor: '#1A1A1A',
      gap: 10,
      minWidth: 120,
    },
    categoryChipSelected: {
      borderColor: '#FF6B35',
      backgroundColor: '#FF6B35' + '20',
    },
    categoryDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    categoryTextSelected: {
      color: '#FF6B35',
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
      borderColor: '#FFFFFF',
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
      backgroundColor: '#1A1A1A',
      borderWidth: 2,
      borderColor: '#404040',
      borderRadius: 16,
      padding: 16,
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    taskInputFocused: {
      borderColor: '#FF6B35',
    },
    taskButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addTaskButton: {
      backgroundColor: '#FF6B35' + '30',
      borderWidth: 2,
      borderColor: '#FF6B35' + '60',
    },
    removeTaskButton: {
      backgroundColor: '#FF4444' + '30',
      borderWidth: 2,
      borderColor: '#FF4444' + '60',
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
      backgroundColor: '#1A1A1A',
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
      borderTopColor: '#404040',
      gap: 16,
      backgroundColor: '#333333',
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
      backgroundColor: '#404040',
      borderWidth: 2,
      borderColor: '#555555',
    },
    saveButton: {
      backgroundColor: '#FF6B35',
    },
    saveButtonDisabled: {
      backgroundColor: '#666666',
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
    },
    cancelButtonText: {
      color: '#B0B0B0',
    },
    saveButtonText: {
      color: '#FFFFFF',
    },
    validationSummary: {
      backgroundColor: '#FF4444' + '20',
      borderWidth: 2,
      borderColor: '#FF4444' + '50',
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    validationTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FF4444',
      marginBottom: 12,
    },
    validationItem: {
      fontSize: 12,
      color: '#FF4444',
      marginBottom: 6,
      fontWeight: '500',
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
                <X size={20} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Validation Errors */}
              {hasErrors && (
                <View style={styles.validationSummary}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <AlertCircle size={16} color="#FF4444" />
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
                  <View style={[styles.sectionIcon, { backgroundColor: '#FF6B35' + '30' }]}>
                    <Target size={18} color="#FF6B35" />
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
                  placeholderTextColor="#666666"
                  maxLength={50}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              </View>

              {/* Time Section - Matching the design */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FF6B35' + '30' }]}>
                    <Clock size={18} color="#FF6B35" />
                  </View>
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Time & Duration</Text>
                    <Text style={styles.sectionDescription}>When will this happen?</Text>
                  </View>
                </View>
                
                <View style={styles.timeContainer}>
                  <View style={styles.timeRow}>
                    <View style={styles.timePickerWrapper}>
                      <Text style={styles.timePickerLabel}>Start Time</Text>
                      <TouchableOpacity style={styles.timePickerButton}>
                        <Clock size={20} color="#FF6B35" />
                        <Text style={styles.timePickerTime}>
                          {formatTime12Hour(startTime).split(' ')[0]}
                        </Text>
                        <Text style={styles.timePickerPeriod}>
                          {formatTime12Hour(startTime).split(' ')[1]}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.timePickerWrapper}>
                      <Text style={styles.timePickerLabel}>End Time</Text>
                      <TouchableOpacity style={styles.timePickerButton}>
                        <Clock size={20} color="#FF6B35" />
                        <Text style={styles.timePickerTime}>
                          {formatTime12Hour(endTime).split(' ')[0]}
                        </Text>
                        <Text style={styles.timePickerPeriod}>
                          {formatTime12Hour(endTime).split(' ')[1]}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.durationCard}>
                    <Text style={styles.durationLabel}>DURATION</Text>
                    <Text style={styles.durationText}>{getDuration()}</Text>
                  </View>
                  
                  {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
                </View>

                {/* Hidden time pickers for functionality */}
                <View style={{ opacity: 0, height: 0, overflow: 'hidden' }}>
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
              </View>

              {/* Category Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FF6B35' + '30' }]}>
                    <Tag size={18} color="#FF6B35" />
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

              {/* Tasks Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FF6B35' + '30' }]}>
                    <Calendar size={18} color="#FF6B35" />
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
                          <Trash2 size={16} color="#FF4444" />
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