import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { Pause, Play, Square, RotateCcw, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface FocusTimerProps {
  duration: number; // in minutes
  onComplete: () => void;
  onStop: () => void;
  onEnd: () => void;
  blockTitle: string;
  blockColor: string;
}

export default function FocusTimer({ 
  duration, 
  onComplete, 
  onStop,
  onEnd,
  blockTitle, 
  blockColor 
}: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const { colors } = useTheme();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft, onComplete]);

  useEffect(() => {
    // Pulse animation when running
    const pulse = () => {
      if (isRunning && !isPaused) {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isRunning && !isPaused) pulse();
        });
      }
    };

    if (isRunning && !isPaused) pulse();
  }, [isRunning, isPaused, pulseAnim]);

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
    if (timeLeft <= 0) return;
    
    if (isPaused) {
      setIsPaused(false);
      setIsRunning(true);
    } else {
      setIsPaused(true);
      setIsRunning(false);
    }
  };

  const resetTimer = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the timer? This will restart your focus session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setTimeLeft(duration * 60);
            setIsRunning(true);
            setIsPaused(false);
          }
        }
      ]
    );
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(true);
    onStop();
  };

  const handleEnd = () => {
    setIsRunning(false);
    setIsPaused(false);
    onEnd();
  };

  const getTimerStatus = () => {
    if (timeLeft <= 0) return 'completed';
    if (isPaused) return 'paused';
    if (isRunning) return 'running';
    return 'stopped';
  };

  const getStatusText = () => {
    const status = getTimerStatus();
    switch (status) {
      case 'completed': return 'Session Complete!';
      case 'paused': return 'Paused';
      case 'running': return 'Focus Mode Active';
      default: return 'Ready to Focus';
    }
  };

  const getStatusColor = () => {
    const status = getTimerStatus();
    switch (status) {
      case 'completed': return colors.success;
      case 'paused': return colors.warning;
      case 'running': return blockColor;
      default: return colors.textSecondary;
    }
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
      marginBottom: 8,
      textAlign: 'center',
    },
    statusContainer: {
      backgroundColor: getStatusColor() + '20',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: getStatusColor() + '40',
    },
    statusText: {
      fontSize: 14,
      color: getStatusColor(),
      fontWeight: '600',
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerCircle: {
      width: 280,
      height: 280,
      borderRadius: 140,
      borderWidth: 8,
      borderColor: blockColor,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      shadowColor: blockColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    timeText: {
      fontSize: 52,
      fontWeight: '700',
      color: blockColor,
      marginBottom: 8,
    },
    remainingText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    progressContainer: {
      width: '100%',
      alignItems: 'center',
      marginTop: 32,
    },
    progressBar: {
      width: '80%',
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: blockColor,
    },
    progressText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      marginBottom: 20,
    },
    controlButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
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
    resetButton: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.warning + '50',
    },
    stopButton: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.error + '50',
    },
    endButton: {
      backgroundColor: colors.error,
    },
    disabledButton: {
      opacity: 0.5,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 16,
      width: '100%',
      paddingHorizontal: 20,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
    },
    stopActionButton: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
    },
    endActionButton: {
      backgroundColor: colors.error,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    stopActionText: {
      color: colors.textSecondary,
    },
    endActionText: {
      color: 'white',
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
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.timerContainer}>
        <Animated.View 
          style={[
            styles.timerCircle,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Text style={styles.timeText}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={styles.remainingText}>
            {timeLeft <= 0 ? 'Complete!' : 'remaining'}
          </Text>
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
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.resetButton]}
          onPress={resetTimer}
          disabled={timeLeft <= 0}
        >
          <RotateCcw size={20} color={timeLeft <= 0 ? colors.textSecondary : colors.warning} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.controlButton, 
            styles.primaryButton,
            timeLeft <= 0 && styles.disabledButton
          ]}
          onPress={toggleTimer}
          disabled={timeLeft <= 0}
        >
          {isPaused ? (
            <Play size={28} color="white" />
          ) : (
            <Pause size={28} color="white" />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.stopButton]}
          onPress={handleStop}
        >
          <Square size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.stopActionButton]}
          onPress={handleStop}
        >
          <Pause size={16} color={colors.textSecondary} />
          <Text style={[styles.actionButtonText, styles.stopActionText]}>Pause & Exit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.endActionButton]}
          onPress={handleEnd}
        >
          <X size={16} color="white" />
          <Text style={[styles.actionButtonText, styles.endActionText]}>End Session</Text>
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