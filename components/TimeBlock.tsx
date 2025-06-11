import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Alert, Animated } from 'react-native';
import { Clock, Play, CircleCheck as CheckCircle, Trash2 } from 'lucide-react-native';
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
}

export default function TimeBlock({ block, onPress, onStartFocus, onDelete }: TimeBlockProps) {
  const { colors } = useTheme();
  const [translateX] = useState(new Animated.Value(0));
  const [isSwipeActive, setIsSwipeActive] = useState(false);

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
      
      if (translationX < -100) {
        // Swipe left to reveal delete
        setIsSwipeActive(true);
        Animated.spring(translateX, {
          toValue: -80,
          useNativeDriver: false,
        }).start();
      } else {
        // Reset position
        setIsSwipeActive(false);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    }
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
            // Reset swipe position on cancel
            setIsSwipeActive(false);
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Reset swipe position first
            setIsSwipeActive(false);
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: false,
            }).start(() => {
              // Call delete function after animation completes
              onDelete(block.id);
            });
          }
        }
      ]
    );
  };

  const resetSwipe = () => {
    if (isSwipeActive) {
      setIsSwipeActive(false);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
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
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 6,
      position: 'relative',
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
    deleteButton: {
      backgroundColor: colors.error,
      width: 80,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      marginLeft: 8,
    },
    deleteButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.swipeContainer}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}
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
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color="white" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}