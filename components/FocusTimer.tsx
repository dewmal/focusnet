import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, StatusBar, Dimensions } from 'react-native';
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
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

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
    // Gentle pulse animation when running
    const pulse = () => {
      if (isRunning && !isPaused) {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.01,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 3000,
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
            setShowControls(false);
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

  // Calculate responsive sizes
  const timerSize = Math.min(screenWidth * 0.75, screenHeight * 0.4, 350);
  const fontSize = Math.min(timerSize * 0.18, 64);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1A1A1A', // Dark background for focus
      position: 'relative',
    },
    exitButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: Math.max(40, screenHeight * 0.05),
      maxWidth: screenWidth * 0.9,
    },
    blockTitle: {
      fontSize: Math.min(32, screenWidth * 0.08),
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 20,
      textAlign: 'center',
      lineHeight: Math.min(40, screenWidth * 0.1),
    },
    statusContainer: {
      backgroundColor: getStatusColor() + '20',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: getStatusColor() + '40',
    },
    statusText: {
      fontSize: 16,
      color: getStatusColor(),
      fontWeight: '700',
      letterSpacing: 1,
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Math.max(40, screenHeight * 0.05),
    },
    timerCircle: {
      width: timerSize,
      height: timerSize,
      borderRadius: timerSize / 2,
      borderWidth: 8,
      borderColor: blockColor,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      shadowColor: blockColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 30,
      elevation: 15,
      marginBottom: 30,
    },
    timeText: {
      fontSize: fontSize,
      fontWeight: '700',
      color: blockColor,
      marginBottom: 8,
      letterSpacing: -2,
      textShadowColor: blockColor + '40',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 20,
    },
    remainingText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '600',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    progressContainer: {
      width: '100%',
      alignItems: 'center',
      maxWidth: Math.min(350, screenWidth * 0.8),
    },
    progressBar: {
      width: '100%',
      height: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: blockColor,
      shadowColor: blockColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 8,
    },
    progressText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    controlsToggle: {
      position: 'absolute',
      bottom: 120,
      alignSelf: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    controlsToggleText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '600',
    },
    controls: {
      position: 'absolute',
      bottom: 60,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      alignSelf: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 30,
      paddingVertical: 20,
      borderRadius: 35,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    controlButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    primaryButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: blockColor,
      shadowColor: blockColor,
      shadowOpacity: 0.6,
    },
    secondaryButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    resetButton: {
      backgroundColor: 'rgba(255, 184, 0, 0.2)',
      borderWidth: 2,
      borderColor: 'rgba(255, 184, 0, 0.4)',
    },
    disabledButton: {
      opacity: 0.4,
    },
    motivationContainer: {
      position: 'absolute',
      bottom: Math.max(200, screenHeight * 0.25),
      alignSelf: 'center',
      paddingHorizontal: 40,
      maxWidth: Math.min(400, screenWidth * 0.9),
    },
    motivationText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.6)',
      fontStyle: 'italic',
      textAlign: 'center',
      lineHeight: 24,
      fontWeight: '500',
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
        <X size={24} color="rgba(255, 255, 255, 0.9)" />
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
            <RotateCcw size={20} color={timeLeft <= 0 ? 'rgba(255, 255, 255, 0.4)' : '#FFB800'} />
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
            <X size={20} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}