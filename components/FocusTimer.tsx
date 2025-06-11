import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, StatusBar } from 'react-native';
import { X, Pause, Play, RotateCcw } from 'lucide-react-native';
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
  const [showControls, setShowControls] = useState(false);
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
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
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

  const handleExit = () => {
    Alert.alert(
      'Exit Focus Mode',
      'Do you want to exit focus mode?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pause & Exit', 
          onPress: () => {
            setIsRunning(false);
            setIsPaused(true);
            onStop();
          }
        },
        { 
          text: 'End Session', 
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            setIsPaused(false);
            onEnd();
          }
        }
      ]
    );
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
      case 'completed': return 'Session Complete! 🎉';
      case 'paused': return 'Paused';
      case 'running': return 'Deep Focus Mode';
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
      backgroundColor: colors.background,
      position: 'relative',
    },
    exitButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface + 'E6',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 60,
    },
    blockTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
      lineHeight: 36,
    },
    statusContainer: {
      backgroundColor: getStatusColor() + '20',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: getStatusColor() + '40',
    },
    statusText: {
      fontSize: 16,
      color: getStatusColor(),
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 60,
    },
    timerCircle: {
      width: 320,
      height: 320,
      borderRadius: 160,
      borderWidth: 12,
      borderColor: blockColor,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      shadowColor: blockColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
      marginBottom: 40,
    },
    timeText: {
      fontSize: 64,
      fontWeight: '700',
      color: blockColor,
      marginBottom: 8,
      letterSpacing: -2,
    },
    remainingText: {
      fontSize: 18,
      color: colors.textSecondary,
      fontWeight: '600',
      letterSpacing: 1,
    },
    progressContainer: {
      width: '100%',
      alignItems: 'center',
      maxWidth: 300,
    },
    progressBar: {
      width: '100%',
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressFill: {
      height: '100%',
      borderRadius: 6,
      backgroundColor: blockColor,
    },
    progressText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    controlsToggle: {
      position: 'absolute',
      bottom: 100,
      alignSelf: 'center',
      backgroundColor: colors.surface + 'E6',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    controlsToggleText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    controls: {
      position: 'absolute',
      bottom: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      alignSelf: 'center',
      backgroundColor: colors.surface + 'F0',
      paddingHorizontal: 30,
      paddingVertical: 20,
      borderRadius: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    controlButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    primaryButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
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
    disabledButton: {
      opacity: 0.5,
    },
    motivationContainer: {
      position: 'absolute',
      bottom: 200,
      alignSelf: 'center',
      paddingHorizontal: 40,
      maxWidth: 350,
    },
    motivationText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      lineHeight: 24,
      opacity: 0.8,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Exit Button */}
      <TouchableOpacity 
        style={styles.exitButton}
        onPress={handleExit}
        activeOpacity={0.8}
      >
        <X size={24} color={colors.text} />
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
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
              {timeLeft <= 0 ? 'COMPLETE' : 'REMAINING'}
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
              {Math.round(getProgress())}% Complete
            </Text>
          </View>
        </View>

        {/* Motivation Quote */}
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            "The successful warrior is the average person with laser-like focus."
          </Text>
        </View>
      </View>

      {/* Controls Toggle */}
      {!showControls && (
        <TouchableOpacity 
          style={styles.controlsToggle}
          onPress={() => setShowControls(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.controlsToggleText}>Tap for controls</Text>
        </TouchableOpacity>
      )}

      {/* Controls */}
      {showControls && (
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.resetButton]}
            onPress={resetTimer}
            disabled={timeLeft <= 0}
            activeOpacity={0.8}
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
            activeOpacity={0.8}
          >
            {isPaused ? (
              <Play size={24} color="white" />
            ) : (
              <Pause size={24} color="white" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={() => setShowControls(false)}
            activeOpacity={0.8}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}