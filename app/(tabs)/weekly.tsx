import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, ChartBar as BarChart3, ChartPie as PieChart } from 'lucide-react-native';
import { loadTimeBlocks } from '@/utils/storage';
import { TimeBlockData } from '@/components/TimeBlock';

export default function WeeklyScreen() {
  const [blocks, setBlocks] = useState<TimeBlockData[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedBlocks = await loadTimeBlocks();
    setBlocks(savedBlocks);
  };

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(weekDate);
    }
    return weekDates;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getWeekStats = () => {
    const totalBlocks = blocks.length * 7; // Assuming same blocks for each day
    const completedBlocks = blocks.filter(b => b.isCompleted).length * 7;
    const totalHours = blocks.reduce((acc, block) => {
      const start = new Date(`2000-01-01 ${block.startTime}`);
      const end = new Date(`2000-01-01 ${block.endTime}`);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0) * 7;

    const categoryStats = blocks.reduce((acc, block) => {
      const duration = (() => {
        const start = new Date(`2000-01-01 ${block.startTime}`);
        const end = new Date(`2000-01-01 ${block.endTime}`);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      })();
      
      acc[block.category] = (acc[block.category] || 0) + duration * 7;
      return acc;
    }, {} as Record<string, number>);

    return { totalBlocks, completedBlocks, totalHours, categoryStats };
  };

  const weekDates = getWeekDates(currentWeek);
  const stats = getWeekStats();
  const weekRange = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Overview</Text>
          <Text style={styles.subtitle}>Track your progress</Text>
        </View>

        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateWeek('prev')}
          >
            <ChevronLeft size={20} color="#8B7355" />
          </TouchableOpacity>
          
          <Text style={styles.weekRange}>{weekRange}</Text>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateWeek('next')}
          >
            <ChevronRight size={20} color="#8B7355" />
          </TouchableOpacity>
        </View>

        {/* Week Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BarChart3 size={24} color="#FF6B35" />
            <Text style={styles.statNumber}>{Math.round(stats.totalHours)}h</Text>
            <Text style={styles.statLabel}>Total Planned</Text>
          </View>
          <View style={styles.statCard}>
            <PieChart size={24} color="#2E8B8B" />
            <Text style={styles.statNumber}>
              {Math.round((stats.completedBlocks / stats.totalBlocks) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        {/* Weekly Calendar Grid */}
        <View style={styles.calendarContainer}>
          <Text style={styles.sectionTitle}>Week at a Glance</Text>
          <View style={styles.calendarGrid}>
            {weekDates.map((date, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text style={styles.dayName}>{dayNames[index]}</Text>
                <Text style={styles.dayNumber}>{date.getDate()}</Text>
                
                <View style={styles.dayBlocks}>
                  {blocks.slice(0, 4).map((block, blockIndex) => (
                    <View 
                      key={blockIndex}
                      style={[
                        styles.miniBlock, 
                        { backgroundColor: block.color + '40' }
                      ]}
                    >
                      <View 
                        style={[
                          styles.miniBlockFill, 
                          { 
                            backgroundColor: block.color,
                            height: block.isCompleted ? '100%' : `${block.progress || 0}%`
                          }
                        ]} 
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.categoryContainer}>
          <Text style={styles.sectionTitle}>Time by Category</Text>
          {Object.entries(stats.categoryStats).map(([category, hours]) => {
            const percentage = (hours / stats.totalHours) * 100;
            const categoryColor = blocks.find(b => b.category === category)?.color || '#8B7355';
            
            return (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryHours}>{Math.round(hours)}h</Text>
                </View>
                <View style={styles.categoryBar}>
                  <View 
                    style={[
                      styles.categoryBarFill, 
                      { 
                        width: `${percentage}%`,
                        backgroundColor: categoryColor 
                      }
                    ]} 
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Weekly Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Weekly Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>🎯 Most Productive Day</Text>
            <Text style={styles.insightText}>Tuesday - 6 blocks completed</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>⚡ Favorite Focus Time</Text>
            <Text style={styles.insightText}>9:00 AM - 11:00 AM</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>📈 Improvement Streak</Text>
            <Text style={styles.insightText}>3 days of hitting your goals!</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Copy This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
            <Text style={[styles.actionButtonText, styles.secondaryActionText]}>
              Export Summary
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
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  weekRange: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A1810',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  statNumber: {
    fontSize: 24,
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
  calendarContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 12,
  },
  dayBlocks: {
    gap: 4,
  },
  miniBlock: {
    width: 24,
    height: 20,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniBlockFill: {
    width: '100%',
    borderRadius: 3,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1810',
  },
  categoryHours: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
  },
  categoryBar: {
    height: 6,
    backgroundColor: '#E8DCC0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: '#FFF8E7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1810',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#8B7355',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
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