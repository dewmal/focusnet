import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Alert, Animated, TextInput, ScrollView, Modal } from 'react-native';
import { Clock, Play, CircleCheck as CheckCircle, Trash2, CreditCard as Edit, Save, X, Plus, ChevronDown, Palette } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { loadCategories, BlockCategory } from '@/utils/storage';

export interface TimeBlockData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  color: string;
  tasks: string[];
  isActive: boolean;
  isCompleted: boolean;
  progress?: number;
}

interface TimeBlockProps {
  block: TimeBlockData;
  onPress: () => void;
  onStartFocus: () => void;
  onDelete?: (blockId: string) => void;
  onEdit?: (blockId: string, updatedBlock: Partial<TimeBlockData>) => void;
}

export default function TimeBlock({ block, onPress, onStartFocus, onDelete, onEdit }: TimeBlockProps) {
  const { colors } = useTheme();
  const [translateX] = useState(new Animated.Value(0));
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const gestureRef = useRef(null);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState(block.title);
  const [editTasks, setEditTasks] = useState([...block.tasks]);
  const [editStartHour, setEditStartHour] = useState(12);
  const [editStartMinute, setEditStartMinute] = useState(0);
  const [editStartPeriod, setEditStartPeriod] = useState<'AM' | 'PM'>('AM');
  const [editEndHour, setEditEndHour] = useState(12);
  const [editEndMinute, setEditEndMinute] = useState(0);
  const [editEndPeriod, setEditEndPeriod] = useState<'AM' | 'PM'>('PM');
  const [editCategory, setEditCategory] = useState(block.category);
  const [editColor, setEditColor] = useState(block.color);
  const [categories, setCategories] = useState<BlockCategory[]>([]);
  
  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const predefinedColors = [
    '#FF6B35', '#2E8B8B', '#8B4F9F', '#4F8B3B', 
    '#B85C38', '#6B4E7D', '#7D6B4E', '#FF4444',
    '#FFB800', '#4CAF50', '#2196F3', '#9C27B0'
  ];

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const periods = ['AM', 'PM'];

  React.useEffect(() => {
    loadCategoriesData();
  }, []);

  React.useEffect(() => {
    // Parse current times when modal opens
    if (isEditModalVisible) {
      parseTimeToEdit();
    }
  }, [isEditModalVisible]);

  const loadCategoriesData = async () => {
    try {
      const savedCategories = await loadCategories();
      setCategories(savedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const parseTimeToEdit = () => {
    // Parse start time
    const [startHour, startMinute] = block.startTime.split(':').map(Number);
    const startPeriod = startHour >= 12 ? 'PM' : 'AM';
    const displayStartHour = startHour === 0 ? 12 : startHour > 12 ? startHour - 12 : startHour;
    
    setEditStartHour(displayStartHour);
    setEditStartMinute(startMinute);
    setEditStartPeriod(startPeriod);

    // Parse end time
    const [endHour, endMinute] = block.endTime.split(':').map(Number);
    const endPeriod = endHour >= 12 ? 'PM' : 'AM';
    const displayEndHour = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
    
    setEditEndHour(displayEndHour);
    setEditEndMinute(endMinute);
    setEditEndPeriod(endPeriod);
  };

  const formatTimeTo24Hour = (hour: number, minute: number, period: 'AM' | 'PM') => {
    let hour24 = hour;
    if (period === 'AM' && hour === 12) hour24 = 0;
    if (period === 'PM' && hour !== 12) hour24 = hour + 12;
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const getStatusIcon = () => {
    if (block.isCompleted) {
      return <CheckCircle size={16} color={colors.success} />;
    }
    if (block.isActive) {
      return <Play size={16} color={colors.primary} />;
    }
    return <Clock size={16} color={colors.textSecondary} />;
  };

  const getProgressWidth = () => {
    if (block.isCompleted) return '100%';
    if (block.progress) return `${block.progress}%`;
    return '0%';
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    const { state, translationX } = event.nativeEvent;
    
    if (state === State.END) {
      if (translationX < -60) {
        setIsSwipeActive(true);
        Animated.spring(translateX, {
          toValue: -140,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        resetSwipe();
      }
    }
  };

  const resetSwipe = () => {
    setIsSwipeActive(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleEdit = () => {
    setEditTitle(block.title);
    setEditTasks([...block.tasks]);
    setEditCategory(block.category);
    setEditColor(block.color);
    resetSwipe();
    setIsEditModalVisible(true);
  };

  const handleDelete = () => {
    if (!onDelete) {
      Alert.alert('Error', 'Delete function not available');
      return;
    }

    Alert.alert(
      'Delete Time Block',
      `Are you sure you want to delete "${block.title}"?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: resetSwipe
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(block.id);
          }
        }
      ]
    );
  };

  const handleBlockPress = () => {
    if (isSwipeActive) {
      resetSwipe();
    } else {
      onPress();
    }
  };

  const handleStartFocus = () => {
    if (!isSwipeActive) {
      onStartFocus();
    } else {
      resetSwipe();
    }
  };

  const handleSaveEdit = () => {
    if (!onEdit) {
      Alert.alert('Error', 'Edit function not available');
      return;
    }

    if (!editTitle.trim()) {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }

    // Validate times
    const startTime24 = formatTimeTo24Hour(editStartHour, editStartMinute, editStartPeriod);
    const endTime24 = formatTimeTo24Hour(editEndHour, editEndMinute, editEndPeriod);
    
    const startMinutes = parseInt(startTime24.split(':')[0]) * 60 + parseInt(startTime24.split(':')[1]);
    const endMinutes = parseInt(endTime24.split(':')[0]) * 60 + parseInt(endTime24.split(':')[1]);
    
    if (endMinutes <= startMinutes) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    const filteredTasks = editTasks.filter(task => task.trim() !== '');
    
    onEdit(block.id, {
      title: editTitle.trim(),
      startTime: startTime24,
      endTime: endTime24,
      category: editCategory,
      color: editColor,
      tasks: filteredTasks,
    });

    setIsEditModalVisible(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(block.title);
    setEditTasks([...block.tasks]);
    setEditCategory(block.category);
    setEditColor(block.color);
    setActiveDropdown(null);
    setIsEditModalVisible(false);
  };

  const handleAddTask = () => {
    if (editTasks.length < 5) {
      setEditTasks([...editTasks, '']);
    }
  };

  const handleRemoveTask = (index: number) => {
    if (editTasks.length > 1) {
      const newTasks = editTasks.filter((_, i) => i !== index);
      setEditTasks(newTasks);
    }
  };

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...editTasks];
    newTasks[index] = value;
    setEditTasks(newTasks);
  };

  const renderDropdown = (type: string, options: any[], selectedValue: any, onSelect: (value: any) => void) => {
    if (activeDropdown !== type) return null;

    return (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setActiveDropdown(null)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select {type}</Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
              {options.map((option, index) => {
                const value = typeof option === 'object' ? option.value || option.name : option;
                const label = typeof option === 'object' ? option.label || option.name : 
                  (type === 'minute' || type === 'hour') ? 
                    option.toString().padStart(2, '0') : option.toString();
                const isSelected = selectedValue === value;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                    onPress={() => {
                      onSelect(value);
                      setActiveDropdown(null);
                    }}
                    activeOpacity={0.7}
                  >
                    {typeof option === 'object' && option.color && (
                      <View style={[styles.categoryDot, { backgroundColor: option.color }]} />
                    )}
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
        </TouchableOpacity>
      </Modal>
    );
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 6,
    },
    swipeContainer: {
      position: 'relative',
      borderRadius: 12,
      overflow: 'hidden',
    },
    actionsContainer: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 140,
      flexDirection: 'row',
      zIndex: 0,
    },
    actionButton: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 120,
    },
    editButton: {
      backgroundColor: '#007AFF',
    },
    deleteButton: {
      backgroundColor: '#FF3B30',
    },
    actionButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    blockContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: block.color,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      minHeight: 120,
      zIndex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    timeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timeText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    playButton: {
      padding: 8,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: block.color,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    category: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: 8,
    },
    tasksContainer: {
      marginBottom: 12,
    },
    task: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    moreTasks: {
      fontSize: 11,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    progressBar: {
      height: 3,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: block.color,
    },
    // Edit Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      width: '95%',
      maxHeight: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    formSection: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    titleInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    timeSection: {
      marginBottom: 20,
    },
    timeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    timeDropdown: {
      flex: 1,
    },
    timeDropdownButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timeDropdownText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    timeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 4,
    },
    categorySection: {
      marginBottom: 20,
    },
    categoryDropdownButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryDropdownContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    categoryDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    colorSection: {
      marginBottom: 20,
    },
    colorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorOptionSelected: {
      borderColor: colors.text,
      transform: [{ scale: 1.1 }],
    },
    colorPreview: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    tasksSection: {
      marginBottom: 20,
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    taskInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
    },
    taskButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeTaskButton: {
      backgroundColor: colors.error + '30',
      borderWidth: 1,
      borderColor: colors.error + '60',
    },
    addTaskButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 8,
      gap: 8,
      backgroundColor: colors.background,
    },
    addTaskText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.textSecondary,
    },
    saveButtonText: {
      color: 'white',
    },
    // Dropdown styles
    dropdownOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownModal: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: '80%',
      maxHeight: '60%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    dropdownList: {
      maxHeight: 250,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
      gap: 8,
    },
    dropdownOptionSelected: {
      backgroundColor: colors.primary + '20',
    },
    dropdownOptionText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    dropdownOptionTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.swipeContainer}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
            activeOpacity={0.8}
          >
            <Edit size={20} color="white" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Trash2 size={20} color="white" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        <PanGestureHandler
          ref={gestureRef}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-15, 15]}
          failOffsetY={[-10, 10]}
        >
          <Animated.View
            style={[
              styles.blockContainer,
              { transform: [{ translateX }] }
            ]}
          >
            <Pressable onPress={handleBlockPress}>
              <View style={styles.header}>
                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>
                    {formatTime12Hour(block.startTime)} - {formatTime12Hour(block.endTime)}
                  </Text>
                  {getStatusIcon()}
                </View>
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={handleStartFocus}
                >
                  <Play size={14} color="white" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.title}>{block.title}</Text>
              <Text style={styles.category}>{block.category}</Text>
              
              {block.tasks.length > 0 && (
                <View style={styles.tasksContainer}>
                  {block.tasks.slice(0, 2).map((task, index) => (
                    <Text key={index} style={styles.task}>• {task}</Text>
                  ))}
                  {block.tasks.length > 2 && (
                    <Text style={styles.moreTasks}>+{block.tasks.length - 2} more</Text>
                  )}
                </View>
              )}
              
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { 
                    width: getProgressWidth(),
                  }]} 
                />
              </View>
            </Pressable>
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Enhanced Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Time Block</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancelEdit}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title Section */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Title</Text>
                <TextInput
                  style={styles.titleInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Enter block title..."
                  placeholderTextColor={colors.textSecondary}
                  maxLength={50}
                />
              </View>

              {/* Time Section */}
              <View style={styles.timeSection}>
                <Text style={styles.formLabel}>Time</Text>
                
                {/* Start Time */}
                <Text style={styles.timeLabel}>Start Time</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timeDropdown}>
                    <TouchableOpacity 
                      style={styles.timeDropdownButton}
                      onPress={() => setActiveDropdown('startHour')}
                    >
                      <Text style={styles.timeDropdownText}>
                        {editStartHour.toString().padStart(2, '0')}
                      </Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timeDropdown}>
                    <TouchableOpacity 
                      style={styles.timeDropdownButton}
                      onPress={() => setActiveDropdown('startMinute')}
                    >
                      <Text style={styles.timeDropdownText}>
                        {editStartMinute.toString().padStart(2, '0')}
                      </Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timeDropdown}>
                    <TouchableOpacity 
                      style={styles.timeDropdownButton}
                      onPress={() => setActiveDropdown('startPeriod')}
                    >
                      <Text style={styles.timeDropdownText}>{editStartPeriod}</Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* End Time */}
                <Text style={styles.timeLabel}>End Time</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timeDropdown}>
                    <TouchableOpacity 
                      style={styles.timeDropdownButton}
                      onPress={() => setActiveDropdown('endHour')}
                    >
                      <Text style={styles.timeDropdownText}>
                        {editEndHour.toString().padStart(2, '0')}
                      </Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timeDropdown}>
                    <TouchableOpacity 
                      style={styles.timeDropdownButton}
                      onPress={() => setActiveDropdown('endMinute')}
                    >
                      <Text style={styles.timeDropdownText}>
                        {editEndMinute.toString().padStart(2, '0')}
                      </Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timeDropdown}>
                    <TouchableOpacity 
                      style={styles.timeDropdownButton}
                      onPress={() => setActiveDropdown('endPeriod')}
                    >
                      <Text style={styles.timeDropdownText}>{editEndPeriod}</Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Category Section */}
              <View style={styles.categorySection}>
                <Text style={styles.formLabel}>Category</Text>
                <TouchableOpacity 
                  style={styles.categoryDropdownButton}
                  onPress={() => setActiveDropdown('category')}
                >
                  <View style={styles.categoryDropdownContent}>
                    <View style={[styles.categoryDot, { backgroundColor: editColor }]} />
                    <Text style={styles.timeDropdownText}>{editCategory}</Text>
                  </View>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Color Section */}
              <View style={styles.colorSection}>
                <Text style={styles.formLabel}>Color</Text>
                <View style={styles.colorsGrid}>
                  {predefinedColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        editColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setEditColor(color)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[styles.colorPreview, { backgroundColor: color }]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tasks Section */}
              <View style={styles.tasksSection}>
                <Text style={styles.formLabel}>Tasks</Text>
                {editTasks.map((task, index) => (
                  <View key={index} style={styles.taskRow}>
                    <TextInput
                      style={styles.taskInput}
                      value={task}
                      onChangeText={(value) => handleTaskChange(index, value)}
                      placeholder={`Task ${index + 1}...`}
                      placeholderTextColor={colors.textSecondary}
                      maxLength={100}
                    />
                    {editTasks.length > 1 && (
                      <TouchableOpacity
                        style={[styles.taskButton, styles.removeTaskButton]}
                        onPress={() => handleRemoveTask(index)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                
                {editTasks.length < 5 && (
                  <TouchableOpacity style={styles.addTaskButton} onPress={handleAddTask}>
                    <Plus size={16} color={colors.textSecondary} />
                    <Text style={styles.addTaskText}>Add another task</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Save size={16} color="white" />
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Dropdown Modals */}
        {renderDropdown('startHour', hours, editStartHour, setEditStartHour)}
        {renderDropdown('startMinute', minutes, editStartMinute, setEditStartMinute)}
        {renderDropdown('startPeriod', periods, editStartPeriod, setEditStartPeriod)}
        {renderDropdown('endHour', hours, editEndHour, setEditEndHour)}
        {renderDropdown('endMinute', minutes, editEndMinute, setEditEndMinute)}
        {renderDropdown('endPeriod', periods, editEndPeriod, setEditEndPeriod)}
        {renderDropdown('category', categories, editCategory, (value) => {
          setEditCategory(value);
          const selectedCategory = categories.find(c => c.name === value);
          if (selectedCategory) {
            setEditColor(selectedCategory.color);
          }
        })}
      </Modal>
    </View>
  );
}