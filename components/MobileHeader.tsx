import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, Settings, User, Menu } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showNotifications?: boolean;
  showSettings?: boolean;
  showProfile?: boolean;
  showMenu?: boolean;
  onNotificationsPress?: () => void;
  onSettingsPress?: () => void;
  onProfilePress?: () => void;
  onMenuPress?: () => void;
  rightComponent?: React.ReactNode;
}

export default function MobileHeader({
  title,
  subtitle,
  showNotifications = true,
  showSettings = false,
  showProfile = false,
  showMenu = false,
  onNotificationsPress,
  onSettingsPress,
  onProfilePress,
  onMenuPress,
  rightComponent,
}: MobileHeaderProps) {
  const { colors } = useTheme();

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftSection: {
      flex: 1,
    },
    greeting: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: 2,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    notificationButton: {
      backgroundColor: colors.primary + '15',
      borderColor: colors.primary + '30',
    },
    profileButton: {
      backgroundColor: colors.secondary + '15',
      borderColor: colors.secondary + '30',
    },
    menuButton: {
      backgroundColor: colors.accent + '15',
      borderColor: colors.accent + '30',
    },
    notificationDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.leftSection}>
          {title.includes('Good') ? (
            <>
              <Text style={styles.greeting}>{getCurrentGreeting()}</Text>
              <Text style={styles.title}>Welcome back!</Text>
            </>
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.rightSection}>
          {rightComponent}
          
          {showMenu && (
            <TouchableOpacity
              style={[styles.actionButton, styles.menuButton]}
              onPress={onMenuPress}
            >
              <Menu size={20} color={colors.accent} />
            </TouchableOpacity>
          )}

          {showNotifications && (
            <TouchableOpacity
              style={[styles.actionButton, styles.notificationButton]}
              onPress={onNotificationsPress}
            >
              <Bell size={20} color={colors.primary} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          )}

          {showProfile && (
            <TouchableOpacity
              style={[styles.actionButton, styles.profileButton]}
              onPress={onProfilePress}
            >
              <User size={20} color={colors.secondary} />
            </TouchableOpacity>
          )}

          {showSettings && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSettingsPress}
            >
              <Settings size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}