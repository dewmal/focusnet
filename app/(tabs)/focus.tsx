import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ArrowLeft, Coffee, Zap, CircleCheck as CheckCircle, Clock, TrendingUp, Target } from 'lucide-react-native';
import FocusTimer from '@/components/FocusTimer';
import MobileHeader from '@/components/MobileHeader';
import { loadTimeBlocks, saveTimeBlocks } from '@/utils/storage';
import { TimeBlockData } from '@/components/TimeBlock';
import { useTheme } from '@/contexts/ThemeContext';

export default function FocusScreen() {
  const [activeBlock, setActiveBlock] = useState<TimeBlockData | null>(null);
  const [isInFocusMode, setIsInFocusMode] = useState(false);
  const [blocks, setBlocks] = useState<TimeBlockData[]>([]);
  const { colors } = useTheme();

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

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
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

  const getTodayStats = () => {
    const completedBlocks = blocks.filter(b => b.isCompleted);
    const totalBlocks = blocks.length;
    const totalFocusTime = completedBlocks.reduce((acc, block) => {
      return acc + getBlockDuration(block);
    }, 0);
    
    const averageRating = 4.2; // This would come from reflections in a real app
    
    return {
      completedSessions: completedBlocks.length,
      totalSessions: totalBlocks,
      totalFocusTime: Math.round(totalFocusTime),
      averageRating,
      completionRate: totalBlocks > 0 ? Math.round((completedBlocks.length / totalBlocks) * 100) : 0
    };
  };

  const upcomingBlocks = blocks.filter(block => !block.isCompleted && !block.isActive);
  const completedBlocks = blocks.filter(block => block.isCompleted);
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  const todayStats = getTodayStats();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    focusContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    currentTimeContainer: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    currentTime: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.primary,
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsContainer: {
      marginBottom: 24,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    activeBlockContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    activeBlockCard: {
      backgroundColor: colors.surface,
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
      color: colors.text,
      marginBottom: 4,
    },
    activeBlockTime: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    activeBlockCategory: {
      fontSize: 12,
      color: colors.textSecondary,
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
      paddingVertical: 40,
      paddingHorizontal: 40,
    },
    noActiveTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    noActiveSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    upcomingContainer: {
      marginBottom: 24,
    },
    upcomingBlock: {
      backgroundColor: colors.surface,
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
      color: colors.text,
      marginBottom: 2,
    },
    upcomingBlockTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    miniStartButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completedContainer: {
      marginBottom: 24,
    },
    completedBlock: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 8,
      borderLeftWidth: 3,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderColor: colors.success,
    },
    completedBlockContent: {
      flex: 1,
    },
    completedBlockTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    completedBlockTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    completedBlockDuration: {
      fontSize: 11,
      color: colors.success,
      fontWeight: '600',
    },
    completedIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCompletedContainer: {
      alignItems: 'center',
      paddingVertical: 30,
      paddingHorizontal: 20,
    },
    emptyCompletedText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    tipsContainer: {
      paddingVertical: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 20,
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    tipText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
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
      {/* Mobile Header */}
      <MobileHeader
        title="Focus Mode"
        subtitle="Deep work starts here"
        showNotifications={true}
        onNotificationsPress={() => Alert.alert('Focus Notifications', 'Stay focused! You have 2 active sessions.')}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.currentTimeContainer}>
            <Text style={styles.currentTime}>{formatTime12Hour(currentTime)}</Text>
          </View>

          {/* Today's Focus Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Today's Focus Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <CheckCircle size={20} color={colors.success} />
                <Text style={styles.statNumber}>{todayStats.completedSessions}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Clock size={20} color={colors.primary} />
                <Text style={styles.statNumber}>{todayStats.totalFocusTime}m</Text>
                <Text style={styles.statLabel}>Focus Time</Text>
              </View>
              <View style={styles.statCard}>
                <Target size={20} color={colors.secondary} />
                <Text style={styles.statNumber}>{todayStats.completionRate}%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>
          </View>

          {activeBlock ? (
            <View style={styles.activeBlockContainer}>
              <Text style={styles.sectionTitle}>Current Active Block</Text>
              <View style={[styles.activeBlockCard, { borderLeftColor: activeBlock.color }]}>
                <View style={styles.activeBlockHeader}>
                  <Text style={styles.activeBlockTitle}>{activeBlock.title}</Text>
                  <Text style={styles.activeBlockTime}>
                    {formatTime12Hour(activeBlock.startTime)} - {formatTime12Hour(activeBlock.endTime)}
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
              <Coffee size={48} color={colors.textSecondary} />
              <Text style={styles.noActiveTitle}>No Active Block</Text>
              <Text style={styles.noActiveSubtitle}>
                Select a time block from Today tab to start focusing
              </Text>
            </View>
          )}

          {/* Completed Focus Sessions */}
          <View style={styles.completedContainer}>
            <Text style={styles.sectionTitle}>Completed Today ({completedBlocks.length})</Text>
            {completedBlocks.length > 0 ? (
              completedBlocks.map((block) => (
                <View
                  key={block.id}
                  style={styles.completedBlock}
                >
                  <View style={styles.completedBlockContent}>
                    <Text style={styles.completedBlockTitle}>{block.title}</Text>
                    <Text style={styles.completedBlockTime}>
                      {formatTime12Hour(block.startTime)} - {formatTime12Hour(block.endTime)}
                    </Text>
                    <Text style={styles.completedBlockDuration}>
                      ✓ {getBlockDuration(block)} minutes focused
                    </Text>
                  </View>
                  <View style={styles.completedIcon}>
                    <CheckCircle size={16} color={colors.success} />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCompletedContainer}>
                <Target size={32} color={colors.textSecondary} />
                <Text style={styles.emptyCompletedText}>
                  No completed focus sessions yet today.{'\n'}Start your first session above!
                </Text>
              </View>
            )}
          </View>

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
                      {formatTime12Hour(block.startTime)} - {formatTime12Hour(block.endTime)}
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
            <Text style={styles.tipText}>• Celebrate completed sessions</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}