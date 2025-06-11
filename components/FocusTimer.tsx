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
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
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
            toValue: 1.02,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isRunning && !isPaused) pulse();
        });
      }
    };

    if (isRunning && !isPaused) pulse();
  }, [isRunning, isPaused, pulseAnim]);

  // Auto-hide controls after 5 seconds
  useEffect(() => {
    if (showControls) {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 5000);
      
      setControlsTimeout(timeout);
    }

    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [showControls]);

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
      case 'completed': return '#4CAF50';
      case 'paused': return '#FFB800';
      case 'running': return blockColor;
      default: return 'rgba(255, 255, 255, 0.6)';
    }
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "The successful warrior is the average person with laser-like focus.",
      "Focus is a matter of deciding what things you're not going to do.",
      "Where focus goes, energy flows and results show.",
      "The art of being wise is knowing what to overlook.",
      "Concentrate all your thoughts upon the work at hand.",
      "Focus on being productive instead of busy.",
      "Your focus determines your reality.",
      "The key to success is to focus our conscious mind on things we desire.",
    ];
    
    // Use time left to cycle through quotes
    const quoteIndex = Math.floor((duration * 60 - timeLeft) / 60) % quotes.length;
    return quotes[quoteIndex];
  };

  // Calculate responsive sizes
  const timerSize = Math.min(screenWidth * 0.7, screenHeight * 0.35, 320);
  const fontSize = Math.min(timerSize * 0.16, 56);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0A0A0A', // Even darker for better focus
      position: 'relative',
    },
    exitButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: Math.max(50, screenHeight * 0.06),
      maxWidth: screenWidth * 0.9,
    },
    blockTitle: {
      fontSize: Math.min(28, screenWidth * 0.07),
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 24,
      textAlign: 'center',
      lineHeight: Math.min(36, screenWidth * 0.09),
      letterSpacing: 0.5,
    },
    statusContainer: {
      backgroundColor: getStatusColor() + '15',
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: getStatusColor() + '30',
      shadowColor: getStatusColor(),
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    statusText: {
      fontSize: 15,
      color: getStatusColor(),
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Math.max(50, screenHeight * 0.06),
    },
    timerCircle: {
      width: timerSize,
      height: timerSize,
      borderRadius: timerSize / 2,
      borderWidth: 6,
      borderColor: blockColor,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      shadowColor: blockColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 40,
      elevation: 20,
      marginBottom: 40,
    },
    timeText: {
      fontSize: fontSize,
      fontWeight: '800',
      color: blockColor,
      marginBottom: 8,
      letterSpacing: -1,
      textShadowColor: blockColor + '60',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 25,
    },
    remainingText: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.6)',
      fontWeight: '700',
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    progressContainer: {
      width: '100%',
      alignItems: 'center',
      maxWidth: Math.min(320, screenWidth * 0.75),
    },
    progressBar: {
      width: '100%',
      height: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 20,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: blockColor,
      shadowColor: blockColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 10,
    },
    progressText: {
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '700',
      letterSpacing: 1,
    },
    controlsToggle: {
      position: 'absolute',
      bottom: 140,
      alignSelf: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      paddingHorizontal: 28,
      paddingVertical: 16,
      borderRadius: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    controlsToggleText: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    controls: {
      position: 'absolute',
      bottom: 80,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
      alignSelf: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      paddingHorizontal: 32,
      paddingVertical: 24,
      borderRadius: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 25,
      elevation: 15,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    controlButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    primaryButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: blockColor,
      shadowColor: blockColor,
      shadowOpacity: 0.8,
      shadowRadius: 16,
    },
    secondaryButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    resetButton: {
      backgroundColor: 'rgba(255, 184, 0, 0.15)',
      borderWidth: 2,
      borderColor: 'rgba(255, 184, 0, 0.3)',
    },
    disabledButton: {
      opacity: 0.3,
    },
    motivationContainer: {
      position: 'absolute',
      bottom: Math.max(220, screenHeight * 0.28),
      alignSelf: 'center',
      paddingHorizontal: 50,
      maxWidth: Math.min(450, screenWidth * 0.9),
    },
    motivationText: {
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.5)',
      fontStyle: 'italic',
      textAlign: 'center',
      lineHeight: 24,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    completionCelebration: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -50 }, { translateY: -50 }],
      alignItems: 'center',
      justifyContent: 'center',
    },
    celebrationText: {
      fontSize: 24,
      color: '#4CAF50',
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 20,
      letterSpacing: 1,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Exit Button */}
      <TouchableOpacity 
        style={styles.exitButton}
        onPress={handleExit}
        activeOpacity={0.7}
      >
        <X size={22} color="rgba(255, 255, 255, 0.8)" />
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

        {/* Dynamic Motivational Quote */}
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            "{getMotivationalQuote()}"
          </Text>
        </View>
      </View>

      {/* Controls Toggle */}
      {!showControls && timeLeft > 0 && (
        <TouchableOpacity 
          style={styles.controlsToggle}
          onPress={() => setShowControls(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.controlsToggleText}>Tap for controls</Text>
        </TouchableOpacity>
      )}

      {/* Controls */}
      {showControls && timeLeft > 0 && (
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.resetButton]}
            onPress={resetTimer}
            activeOpacity={0.7}
          >
            <RotateCcw size={18} color="#FFB800" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.primaryButton]}
            onPress={toggleTimer}
            activeOpacity={0.7}
          >
            {isPaused ? (
              <Play size={26} color="white" />
            ) : (
              <Pause size={26} color="white" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={() => setShowControls(false)}
            activeOpacity={0.7}
          >
            <X size={18} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}