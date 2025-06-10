import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Clock, Play, CircleCheck as CheckCircle } from 'lucide-react-native';

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
}

export default function TimeBlock({ block, onPress, onStartFocus }: TimeBlockProps) {
  const getStatusIcon = () => {
    if (block.isCompleted) {
      return <CheckCircle size={16} color="#4CAF50" />;
    }
    if (block.isActive) {
      return <Play size={16} color="#FF6B35" />;
    }
    return <Clock size={16} color="#8B7355" />;
  };

  const getProgressWidth = () => {
    if (block.isCompleted) return '100%';
    if (block.progress) return `${block.progress}%`;
    return '0%';
  };

  return (
    <Pressable 
      style={[styles.container, { borderLeftColor: block.color }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>
            {block.startTime} - {block.endTime}
          </Text>
          {getStatusIcon()}
        </View>
        <TouchableOpacity 
          style={[styles.playButton, { backgroundColor: block.color }]}
          onPress={onStartFocus}
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
            backgroundColor: block.color 
          }]} 
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#8B7355',
    fontWeight: '600',
  },
  playButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
    marginBottom: 8,
  },
  tasksContainer: {
    marginBottom: 12,
  },
  task: {
    fontSize: 12,
    color: '#5D4E37',
    marginBottom: 2,
  },
  moreTasks: {
    fontSize: 11,
    color: '#8B7355',
    fontStyle: 'italic',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E8DCC0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});