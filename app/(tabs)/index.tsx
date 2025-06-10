import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Plus, Calendar, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import TimeBlock, { TimeBlockData } from '@/components/TimeBlock';
import MobileHeader from '@/components/MobileHeader';
import { loadTimeBlocks, saveTimeBlocks } from '@/utils/storage';
import { useTheme } from '@/contexts/ThemeContext';

export default function TodayScreen() {
  const [blocks, setBlocks] = useState<TimeBlockData[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const savedBlocks = await loadTimeBlocks();
    setBlocks(savedBlocks);
  };

  const handleBlockPress = (block: TimeBlockData) => {
    // Navigate to edit screen (we can implement this later)
    Alert.alert('Edit Block', `Edit "${block.title}" functionality coming soon!`);
  };

  const handleStartFocus = (block: TimeBlockData) => {
    setActiveBlockId(block.id);
    // Update block as active
    const updatedBlocks = blocks.map(b => 
      b.id === block.id 
        ? { ...b, isActive: true }
        : { ...b, isActive: false }
    );
    setBlocks(updatedBlocks);
    saveTimeBlocks(updatedBlocks);
  };

  const handleAddQuickBlock = () => {
    Alert.alert(
      'Add Quick Block',
      'Choose a quick block duration:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '30 min', onPress: () => createQuickBlock(30) },
        { text: '60 min', onPress: () => createQuickBlock(60) },
        { text: '90 min', onPress: () => createQuickBlock(90) },
      ]
    );
  };

  const createQuickBlock = async (duration: number) => {
    try {
      const now = new Date();
      const startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const endDate = new Date(now.getTime() + duration * 60000);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      const newBlock: TimeBlockData = {
        id: Date.now().toString(),
        title: `Quick Focus Block (${duration}min)`,
        startTime,
        endTime,
        category: 'Personal',
        color: '#FF6B35',
        tasks: ['Focus on current task'],
        isActive: false,
        isCompleted: false,
        progress: 0,
      };

      const updatedBlocks = [...blocks, newBlock];
      setBlocks(updatedBlocks);
      await saveTimeBlocks(updatedBlocks);
      
      Alert.alert('Success', `Quick ${duration}-minute block has been added!`);
    } catch (error) {
      console.error('Error creating quick block:', error);
      Alert.alert('Error', 'Failed to create quick block. Please try again.');
    }
  };

  const handleCopyYesterday = () => {
    Alert.alert(
      'Copy Yesterday\'s Plan',
      'This will copy your time blocks from yesterday to today. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy', onPress: copyYesterdaysPlan },
      ]
    );
  };

  const copyYesterdaysPlan = async () => {
    try {
      // For demo purposes, we'll duplicate existing blocks with new IDs
      const copiedBlocks = blocks.map(block => ({
        ...block,
        id: `${Date.now()}-${Math.random()}`,
        isActive: false,
        isCompleted: false,
        progress: 0,
      }));

      const updatedBlocks = [...blocks, ...copiedBlocks];
      setBlocks(updatedBlocks);
      await saveTimeBlocks(updatedBlocks);
      
      Alert.alert('Success', `${copiedBlocks.length} blocks have been copied from yesterday!`);
    } catch (error) {
      console.error('Error copying yesterday\'s plan:', error);
      Alert.alert('Error', 'Failed to copy yesterday\'s plan. Please try again.');
    }
  };

  const handleAddButtonPress = () => {
    router.push('/create-block');
  };

  const handleCreateCustomBlock = () => {
    router.push('/create-block');
  };

  const handleNotificationsPress = () => {
    Alert.alert('Notifications', 'You have 3 upcoming focus sessions today!');
  };

  const getTodayStats = () => {
    const completed = blocks.filter(b => b.isCompleted).length;
    const total = blocks.length;
    const totalMinutes = blocks.reduce((acc, block) => {
      const start = new Date(`2000-01-01 ${block.startTime}`);
      const end = new Date(`2000-01-01 ${block.endTime}`);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
    
    return { completed, total, totalMinutes };
  };

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const stats = getTodayStats();
  const currentHour = currentTime.getHours();
  const todayDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const getGreeting = () => {
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const styles = StyleSheet.create({
    container: {
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
    addButton: {
      backgroundColor: colors.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    currentTimeContainer: {
      alignItems: 'center',
      paddingVertical: 16,
      marginBottom: 8,
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
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
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
    blocksContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 4,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    quickActions: {
      paddingBottom: 32,
      gap: 12,
    },
    quickActionButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    quickActionText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryAction: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.border,
      shadowColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
    },
    secondaryActionText: {
      color: colors.textSecondary,
    },
    createBlockButton: {
      backgroundColor: colors.secondary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
      shadowColor: colors.secondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    createBlockText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Action Bar Header */}
      <MobileHeader
        title={getGreeting()}
        subtitle={todayDate}
        showNotifications={true}
        onNotificationsPress={handleNotificationsPress}
        rightComponent={
          <TouchableOpacity style={styles.addButton} onPress={handleAddButtonPress}>
            <Plus size={20} color="white" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Current Time */}
          <View style={styles.currentTimeContainer}>
            <Text style={styles.currentTime}>
              {formatTime12Hour(currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }))}
            </Text>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.statNumber}>{stats.completed}/{stats.total}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={20} color={colors.secondary} />
              <Text style={styles.statNumber}>{Math.round(stats.totalMinutes / 60)}h</Text>
              <Text style={styles.statLabel}>Scheduled</Text>
            </View>
          </View>

          {/* Time Blocks */}
          <View style={styles.blocksContainer}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            {blocks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No time blocks scheduled</Text>
                <Text style={styles.emptySubtext}>Tap the + button to create your first block</Text>
              </View>
            ) : (
              blocks.map((block) => (
                <TimeBlock
                  key={block.id}
                  block={block}
                  onPress={() => handleBlockPress(block)}
                  onStartFocus={() => handleStartFocus(block)}
                />
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.createBlockButton} onPress={handleCreateCustomBlock}>
              <Text style={styles.createBlockText}>Create New Block</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleAddQuickBlock}>
              <Text style={styles.quickActionText}>Add Quick Block</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.secondaryAction]}
              onPress={handleCopyYesterday}
            >
              <Text style={[styles.quickActionText, styles.secondaryActionText]}>
                Copy Yesterday's Plan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}