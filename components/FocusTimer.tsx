import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Pause, Play, Square, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface FocusTimerProps {
  duration: number; // in minutes
  onComplete: () => void;
  onStop: () => void;
  blockTitle: string;
  blockColor: string;
}

export default function FocusTimer({ 
  duration, 
  onComplete, 
  onStop, 
  blockTitle, 
  blockColor 
}: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));
  const { colors } = useTheme();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  useEffect(() => {
    // Pulse animation
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isRunning) pulse();
      });
    };

    if (isRunning) pulse();
  }, [isRunning, pulseAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalSeconds = duration * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeLeft(duration * 60);
    setIsRunning(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
    },
    header: {
      alignItems: 'center',
      marginTop: 20,
    },
    blockTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    timerCircle: {
      width: 250,
      height: 250,
      borderRadius: 125,
      borderWidth: 8,
      borderColor: blockColor,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    timeText: {
      fontSize: 48,
      fontWeight: '700',
      color: blockColor,
      marginBottom: 4,
    },
    remainingText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    progressContainer: {
      width: '100%',
      alignItems: 'center',
    },
    progressBar: {
      width: '80%',
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: blockColor,
    },
    progressText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    controlButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: blockColor,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
    },
    dangerButton: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.error + '50',
    },
    motivationContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    motivationText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.blockTitle}>{blockTitle}</Text>
        <Text style={styles.subtitle}>Focus Session</Text>
      </View>

      <Animated.View 
        style={[
          styles.timerCircle,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <Text style={styles.timeText}>
          {formatTime(timeLeft)}
        </Text>
        <Text style={styles.remainingText}>remaining</Text>
      </Animated.View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${getProgress()}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(getProgress())}% complete
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.secondaryButton]}
          onPress={resetTimer}
        >
          <RotateCcw size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.primaryButton]}
          onPress={toggleTimer}
        >
          {isRunning ? (
            <Pause size={24} color="white" />
          ) : (
            <Play size={24} color="white" />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.dangerButton]}
          onPress={onStop}
        >
          <Square size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.motivationContainer}>
        <Text style={styles.motivationText}>
          "Deep work is like a superpower in our increasingly competitive economy."
        </Text>
      </View>
    </View>
  );
}