import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { ArrowLeft, Coffee, Zap } from 'lucide-react-native';
import FocusTimer from '@/components/FocusTimer';
import { loadTimeBlocks, saveTimeBlocks } from '@/utils/storage';
import { TimeBlockData } from '@/components/TimeBlock';

export default function FocusScreen() {
  const [activeBlock, setActiveBlock] = useState<TimeBlockData | null>(null);
  const [isInFocusMode, setIsInFocusMode] = useState(false);
  const [blocks, setBlocks] = useState<TimeBlockData[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedBlocks = await loadTimeBlocks();
    setBlocks(savedBlocks);
    const currentActive = savedBlocks.find(block => block.isActive);
    if (currentActive) {
      setActiveBlock(currentActive);
    }
  };

  const handleStartFocus = (block: TimeBlockData) => {
    setActiveBlock(block);
    setIsInFocusMode(true);
    
    // Update block status
    const updatedBlocks = blocks.map(b => 
      b.id === block.id 
        ? { ...b, isActive: true }
        : { ...b, isActive: false }
    );
    setBlocks(updatedBlocks);
    saveTimeBlocks(updatedBlocks);
  };

  const handleFocusComplete = () => {
    if (activeBlock) {
      Alert.alert(
        '🎉 Focus Session Complete!',
        `Great job completing your "${activeBlock.title}" session!`,
        [
          { text: 'Take a Break', onPress: handleEndFocus },
          { text: 'Continue Working', onPress: handleEndFocus }
        ]
      );
    }
  };

  const handleEndFocus = () => {
    if (activeBlock) {
      const updatedBlocks = blocks.map(b => 
        b.id === activeBlock.id 
          ? { ...b, isActive: false, isCompleted: true, progress: 100 }
          : b
      );
      setBlocks(updatedBlocks);
      saveTimeBlocks(updatedBlocks);
    }
    
    setIsInFocusMode(false);
    setActiveBlock(null);
  };

  const getBlockDuration = (block: TimeBlockData) => {
    const start = new Date(`2000-01-01 ${block.startTime}`);
    const end = new Date(`2000-01-01 ${block.endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60); // in minutes
  };

  const upcomingBlocks = blocks.filter(block => !block.isCompleted && !block.isActive);
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  if (isInFocusMode && activeBlock) {
    return (
      <SafeAreaView style={styles.focusContainer}>
        <FocusTimer
          duration={getBlockDuration(activeBlock)}
          onComplete={handleFocusComplete}
          onStop={handleEndFocus}
          blockTitle={activeBlock.title}
          blockColor={activeBlock.color}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus Mode</Text>
        <Text style={styles.subtitle}>Deep work starts here</Text>
      </View>

      <View style={styles.currentTimeContainer}>
        <Text style={styles.currentTime}>{currentTime}</Text>
      </View>

      {activeBlock ? (
        <View style={styles.activeBlockContainer}>
          <Text style={styles.sectionTitle}>Current Active Block</Text>
          <View style={[styles.activeBlockCard, { borderLeftColor: activeBlock.color }]}>
            <View style={styles.activeBlockHeader}>
              <Text style={styles.activeBlockTitle}>{activeBlock.title}</Text>
              <Text style={styles.activeBlockTime}>
                {activeBlock.startTime} - {activeBlock.endTime}
              </Text>
            </View>
            <Text style={styles.activeBlockCategory}>{activeBlock.category}</Text>
            
            <TouchableOpacity 
              style={[styles.startFocusButton, { backgroundColor: activeBlock.color }]}
              onPress={() => handleStartFocus(activeBlock)}
            >
              <Zap size={20} color="white" />
              <Text style={styles.startFocusText}>Enter Focus Mode</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.noActiveContainer}>
          <Coffee size={48} color="#8B7355" />
          <Text style={styles.noActiveTitle}>No Active Block</Text>
          <Text style={styles.noActiveSubtitle}>
            Select a time block from Today tab to start focusing
          </Text>
        </View>
      )}

      {upcomingBlocks.length > 0 && (
        <View style={styles.upcomingContainer}>
          <Text style={styles.sectionTitle}>Upcoming Blocks</Text>
          {upcomingBlocks.slice(0, 3).map((block) => (
            <TouchableOpacity
              key={block.id}
              style={[styles.upcomingBlock, { borderLeftColor: block.color }]}
              onPress={() => handleStartFocus(block)}
            >
              <View style={styles.upcomingBlockContent}>
                <Text style={styles.upcomingBlockTitle}>{block.title}</Text>
                <Text style={styles.upcomingBlockTime}>
                  {block.startTime} - {block.endTime}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.miniStartButton, { backgroundColor: block.color }]}
              >
                <Zap size={14} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Focus Tips</Text>
        <Text style={styles.tipText}>• Put your phone in another room</Text>
        <Text style={styles.tipText}>• Use the Pomodoro technique</Text>
        <Text style={styles.tipText}>• Take breaks every 90 minutes</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  focusContainer: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A1810',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
    marginTop: 4,
  },
  currentTimeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  currentTime: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FF6B35',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  activeBlockContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 16,
  },
  activeBlockCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeBlockHeader: {
    marginBottom: 8,
  },
  activeBlockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 4,
  },
  activeBlockTime: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
  },
  activeBlockCategory: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
    marginBottom: 16,
  },
  startFocusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  startFocusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noActiveContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noActiveTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A1810',
    marginTop: 16,
    marginBottom: 8,
  },
  noActiveSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },
  upcomingContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  upcomingBlock: {
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingBlockContent: {
    flex: 1,
  },
  upcomingBlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1810',
    marginBottom: 2,
  },
  upcomingBlockTime: {
    fontSize: 12,
    color: '#8B7355',
  },
  miniStartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF8E7',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 4,
  },
});