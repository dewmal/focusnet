import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Star, BookOpen, TrendingUp, Calendar } from 'lucide-react-native';
import { loadTimeBlocks, loadReflections, saveReflection, DailyReflection } from '@/utils/storage';
import { TimeBlockData } from '@/components/TimeBlock';

export default function ReflectScreen() {
  const [blocks, setBlocks] = useState<TimeBlockData[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlockData | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [savedBlocks, savedReflections] = await Promise.all([
      loadTimeBlocks(),
      loadReflections()
    ]);
    setBlocks(savedBlocks);
    setReflections(savedReflections);
  };

  const today = new Date().toDateString();
  const completedBlocks = blocks.filter(block => block.isCompleted);
  const todayReflections = reflections.filter(r => r.date === today);

  const handleBlockSelect = (block: TimeBlockData) => {
    setSelectedBlock(block);
    const existingReflection = todayReflections.find(r => r.blockId === block.id);
    if (existingReflection) {
      setReflectionText(existingReflection.reflection);
      setRating(existingReflection.rating);
    } else {
      setReflectionText('');
      setRating(0);
    }
  };

  const handleSubmitReflection = async () => {
    if (!selectedBlock || !reflectionText.trim()) {
      Alert.alert('Missing Information', 'Please add your reflection before submitting.');
      return;
    }

    if (rating === 0) {
      Alert.alert('Missing Rating', 'Please rate your focus session.');
      return;
    }

    setIsSubmitting(true);

    const reflection: DailyReflection = {
      date: today,
      blockId: selectedBlock.id,
      blockTitle: selectedBlock.title,
      reflection: reflectionText.trim(),
      rating,
    };

    await saveReflection(reflection);
    await loadData();
    
    setSelectedBlock(null);
    setReflectionText('');
    setRating(0);
    setIsSubmitting(false);

    Alert.alert('Reflection Saved', 'Your reflection has been saved successfully!');
  };

  const getAverageRating = () => {
    if (todayReflections.length === 0) return 0;
    const total = todayReflections.reduce((sum, r) => sum + r.rating, 0);
    return total / todayReflections.length;
  };

  const getReflectionPrompts = () => [
    "What went well during this time block?",
    "What would you do differently next time?",
    "How did you feel during this session?",
    "What was your biggest accomplishment?",
    "What challenged you the most?",
  ];

  const renderStars = (currentRating: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
          >
            <Star
              size={24}
              color={star <= currentRating ? '#FFD700' : '#E8DCC0'}
              fill={star <= currentRating ? '#FFD700' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Daily Reflection</Text>
          <Text style={styles.subtitle}>Learn and improve from today</Text>
        </View>

        {/* Today's Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <BookOpen size={20} color="#FF6B35" />
              <Text style={styles.summaryNumber}>{completedBlocks.length}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
            <View style={styles.summaryCard}>
              <Star size={20} color="#FFD700" />
              <Text style={styles.summaryNumber}>{getAverageRating().toFixed(1)}</Text>
              <Text style={styles.summaryLabel}>Avg Rating</Text>
            </View>
            <View style={styles.summaryCard}>
              <TrendingUp size={20} color="#2E8B8B" />
              <Text style={styles.summaryNumber}>{todayReflections.length}</Text>
              <Text style={styles.summaryLabel}>Reflected</Text>
            </View>
          </View>
        </View>

        {/* Completed Blocks */}
        {completedBlocks.length > 0 ? (
          <View style={styles.blocksContainer}>
            <Text style={styles.sectionTitle}>Reflect on Completed Blocks</Text>
            {completedBlocks.map((block) => {
              const hasReflection = todayReflections.some(r => r.blockId === block.id);
              return (
                <TouchableOpacity
                  key={block.id}
                  style={[
                    styles.blockCard,
                    { borderLeftColor: block.color },
                    hasReflection && styles.reflectedBlock
                  ]}
                  onPress={() => handleBlockSelect(block)}
                >
                  <View style={styles.blockHeader}>
                    <Text style={styles.blockTitle}>{block.title}</Text>
                    <View style={styles.blockMeta}>
                      <Text style={styles.blockTime}>
                        {block.startTime} - {block.endTime}
                      </Text>
                      {hasReflection && (
                        <View style={styles.reflectedBadge}>
                          <Text style={styles.reflectedText}>✓ Reflected</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.blockCategory}>{block.category}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#8B7355" />
            <Text style={styles.emptyTitle}>No Completed Blocks Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete some time blocks to start reflecting on your day
            </Text>
          </View>
        )}

        {/* Reflection Form */}
        {selectedBlock && (
          <View style={styles.reflectionContainer}>
            <Text style={styles.sectionTitle}>
              Reflecting on: {selectedBlock.title}
            </Text>
            
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>How was your focus? (1-5 stars)</Text>
              {renderStars(rating, setRating)}
            </View>

            <View style={styles.promptsSection}>
              <Text style={styles.promptsLabel}>Reflection Prompts:</Text>
              {getReflectionPrompts().map((prompt, index) => (
                <Text key={index} style={styles.promptText}>• {prompt}</Text>
              ))}
            </View>

            <View style={styles.textInputSection}>
              <Text style={styles.inputLabel}>Your Reflection</Text>
              <TextInput
                style={styles.textInput}
                value={reflectionText}
                onChangeText={setReflectionText}
                placeholder="Share your thoughts about this time block..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: selectedBlock.color },
                isSubmitting && styles.disabledButton
              ]}
              onPress={handleSubmitReflection}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Saving...' : 'Save Reflection'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setSelectedBlock(null);
                setReflectionText('');
                setRating(0);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Previous Reflections */}
        {todayReflections.length > 0 && !selectedBlock && (
          <View style={styles.previousReflections}>
            <Text style={styles.sectionTitle}>Today's Reflections</Text>
            {todayReflections.map((reflection, index) => (
              <View key={index} style={styles.reflectionCard}>
                <View style={styles.reflectionHeader}>
                  <Text style={styles.reflectionTitle}>{reflection.blockTitle}</Text>
                  {renderStars(reflection.rating)}
                </View>
                <Text style={styles.reflectionContent}>{reflection.reflection}</Text>
              </View>
            ))}
          </View>
        )}
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
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A1810',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
  blocksContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  blockCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  reflectedBlock: {
    backgroundColor: '#F0F8F0',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  blockHeader: {
    marginBottom: 8,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 4,
  },
  blockMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockTime: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
  reflectedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reflectedText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  blockCategory: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A1810',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },
  reflectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1810',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  promptsSection: {
    marginBottom: 20,
  },
  promptsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1810',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 4,
  },
  textInputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1810',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#E8DCC0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2A1810',
    minHeight: 120,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8B7355',
    fontSize: 14,
    fontWeight: '500',
  },
  previousReflections: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  reflectionCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reflectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1810',
  },
  reflectionContent: {
    fontSize: 14,
    color: '#5D4E37',
    lineHeight: 20,
  },
});