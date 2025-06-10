import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Plus, Calendar, TrendingUp } from 'lucide-react-native';
import TimeBlock, { TimeBlockData } from '@/components/TimeBlock';
import { loadTimeBlocks, saveTimeBlocks } from '@/utils/storage';

export default function TodayScreen() {
  const [blocks, setBlocks] = useState<TimeBlockData[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    const savedBlocks = await loadTimeBlocks();
    setBlocks(savedBlocks);
  };

  const handleBlockPress = (block: TimeBlockData) => {
    // Here you could navigate to block details or edit screen
    console.log('Block pressed:', block.title);
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

  const stats = getTodayStats();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const todayDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good {currentHour < 12 ? 'Morning' : currentHour < 17 ? 'Afternoon' : 'Evening'}
            </Text>
            <Text style={styles.date}>{todayDate}</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Current Time */}
        <View style={styles.currentTimeContainer}>
          <Text style={styles.currentTime}>
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Calendar size={20} color="#FF6B35" />
            <Text style={styles.statNumber}>{stats.completed}/{stats.total}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={20} color="#2E8B8B" />
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
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>Add Quick Block</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, styles.secondaryAction]}>
            <Text style={[styles.quickActionText, styles.secondaryActionText]}>
              Copy Yesterday's Plan
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A1810',
  },
  date: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A1810',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
  blocksContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8B7355',
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E8DCC0',
  },
  secondaryActionText: {
    color: '#8B7355',
  },
});