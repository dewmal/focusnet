import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Alert, Animated, TextInput, ScrollView, Modal } from 'react-native';
import { Clock, Play, CircleCheck as CheckCircle, Trash2, Edit, Save, X, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

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
  
  // Edit form state
  const [editTitle, setEditTitle] = useState(block.title);
  const [editTasks, setEditTasks] = useState([...block.tasks]);

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
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -60) {
        // Swipe left enough to reveal action buttons
        setIsSwipeActive(true);
        Animated.spring(translateX, {
          toValue: -160, // Wider to accommodate both buttons
          useNativeDriver: false,
          tension: 150,
          friction: 8,
        }).start();
      } else {
        // Reset position for any other gesture
        setIsSwipeActive(false);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 150,
          friction: 8,
        }).start();
      }
    }
  };

  const handleEdit = () => {
    // Reset swipe position and open edit modal
    setIsSwipeActive(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 150,
      friction: 8,
    }).start();
    
    // Reset edit form with current values
    setEditTitle(block.title);
    setEditTasks([...block.tasks]);
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
          onPress: () => {
            // Reset swipe position when cancelled
            setIsSwipeActive(false);
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: false,
              tension: 150,
              friction: 8,
            }).start();
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Reset position first, then delete
            setIsSwipeActive(false);
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: false,
              tension: 150,
              friction: 8,
            }).start(() => {
              onDelete(block.id);
            });
          }
        }
      ]
    );
  };

  const handleBlockPress = () => {
    if (isSwipeActive) {
      // If swipe is active, tapping should close the swipe
      setIsSwipeActive(false);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
        tension: 150,
        friction: 8,
      }).start();
    } else {
      onPress();
    }
  };

  const handleStartFocus = () => {
    if (!isSwipeActive) {
      onStartFocus();
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

    const filteredTasks = editTasks.filter(task => task.trim() !== '');
    
    onEdit(block.id, {
      title: editTitle.trim(),
      tasks: filteredTasks,
    });

    setIsEditModalVisible(false);
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    setEditTitle(block.title);
    setEditTasks([...block.tasks]);
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

  const styles = StyleSheet.create({
    container: {
      marginVertical: 6,
      position: 'relative',
      overflow: 'hidden',
    },
    swipeContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
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
      width: '100%',
      minHeight: 120,
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
    actionsContainer: {
      flexDirection: 'row',
    },
    actionButton: {
      width: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButton: {
      backgroundColor: '#007AFF',
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
    deleteButton: {
      backgroundColor: '#FF3B30',
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
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
      width: '90%',
      maxHeight: '80%',
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
  });

  return (
    <View style={styles.container}>
      <View style={styles.swipeContainer}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}
          failOffsetY={[-5, 5]}
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

        {isSwipeActive && (
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
        )}
      </View>

      {/* Edit Modal */}
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
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}