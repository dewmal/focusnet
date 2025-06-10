import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { Palette, Bell, User, Moon, Sun, Plus, Trash2, CreditCard as Edit } from 'lucide-react-native';
import { loadCategories, saveCategories, BlockCategory, loadSettings, saveSettings, AppSettings, resetAllData } from '@/utils/storage';
import { useTheme } from '@/contexts/ThemeContext';
import ClockTimePicker from '@/components/ClockTimePicker';

export default function SettingsScreen() {
  const [categories, setCategories] = useState<BlockCategory[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    isDarkMode: false,
    notificationsEnabled: true,
    workingHours: { start: '09:00', end: '17:00' },
    defaultDuration: 60,
  });
  const [editingCategory, setEditingCategory] = useState<BlockCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const { isDarkMode, toggleDarkMode, colors } = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [savedCategories, savedSettings] = await Promise.all([
      loadCategories(),
      loadSettings()
    ]);
    setCategories(savedCategories);
    setSettings(savedSettings);
  };

  const handleSettingChange = async (key: keyof AppSettings, value: any) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  const handleWorkingHoursChange = async (type: 'start' | 'end', time: string) => {
    const updatedWorkingHours = { ...settings.workingHours, [type]: time };
    const updatedSettings = { ...settings, workingHours: updatedWorkingHours };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const colors = ['#FF6B35', '#2E8B8B', '#8B4F9F', '#4F8B3B', '#B85C38', '#6B4E7D', '#7D6B4E'];
    const usedColors = categories.map(c => c.color);
    const availableColor = colors.find(c => !usedColors.includes(c)) || colors[0];

    const newCategory: BlockCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      color: availableColor,
      icon: 'circle',
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await saveCategories(updatedCategories);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedCategories = categories.filter(c => c.id !== categoryId);
            setCategories(updatedCategories);
            await saveCategories(updatedCategories);
          }
        }
      ]
    );
  };

  const handleEditCategory = (category: BlockCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    const updatedCategories = categories.map(c =>
      c.id === editingCategory.id
        ? { ...c, name: newCategoryName.trim() }
        : c
    );
    
    setCategories(updatedCategories);
    await saveCategories(updatedCategories);
    setEditingCategory(null);
    setNewCategoryName('');
  };

  const handleResetAllData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your time blocks, reflections, categories, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              await resetAllData();
              // Reload default data
              await loadData();
              Alert.alert('Success', 'All data has been reset successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            } finally {
              setIsResetting(false);
            }
          }
        }
      ]
    );
  };

  const durations = [30, 45, 60, 90, 120];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 4,
    },
    section: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    settingDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    durationContainer: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    durationButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    selectedDuration: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    durationText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    selectedDurationText: {
      color: 'white',
    },
    addCategoryContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    categoryInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
    },
    addCategoryButton: {
      backgroundColor: colors.accent,
      width: 44,
      height: 44,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addCategoryButtonDisabled: {
      backgroundColor: colors.textSecondary,
      opacity: 0.5,
    },
    cancelEditButton: {
      alignItems: 'center',
      marginBottom: 16,
    },
    cancelEditText: {
      color: colors.error,
      fontSize: 14,
      fontWeight: '500',
    },
    categoriesList: {
      gap: 8,
    },
    categoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    categoryColor: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    categoryName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    categoryActions: {
      flexDirection: 'row',
      gap: 12,
    },
    categoryActionButton: {
      padding: 4,
    },
    appVersion: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 8,
    },
    appDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    dangerButton: {
      backgroundColor: colors.error,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 8,
      opacity: isResetting ? 0.6 : 1,
    },
    dangerButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    dangerDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  const isAddButtonDisabled = !newCategoryName.trim();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your FocusNest</Text>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            {isDarkMode ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#FFF' : '#FFF'}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => handleSettingChange('notificationsEnabled', value)}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={settings.notificationsEnabled ? '#FFF' : '#FFF'}
            />
          </View>
          
          <Text style={styles.settingDescription}>
            Get reminders when blocks start and end
          </Text>
        </View>

        {/* Working Hours */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Working Hours</Text>
          </View>
          
          <ClockTimePicker
            value={settings.workingHours.start}
            onTimeChange={(time) => handleWorkingHoursChange('start', time)}
            label="Start Time"
          />
          
          <ClockTimePicker
            value={settings.workingHours.end}
            onTimeChange={(time) => handleWorkingHoursChange('end', time)}
            label="End Time"
          />
        </View>

        {/* Default Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Block Duration</Text>
          <View style={styles.durationContainer}>
            {durations.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  settings.defaultDuration === duration && styles.selectedDuration
                ]}
                onPress={() => handleSettingChange('defaultDuration', duration)}
              >
                <Text
                  style={[
                    styles.durationText,
                    settings.defaultDuration === duration && styles.selectedDurationText
                  ]}
                >
                  {duration}min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Block Categories</Text>
          </View>
          
          {/* Add New Category */}
          <View style={styles.addCategoryContainer}>
            <TextInput
              style={styles.categoryInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Add new category..."
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              style={[
                styles.addCategoryButton,
                isAddButtonDisabled && styles.addCategoryButtonDisabled
              ]}
              onPress={editingCategory ? handleSaveEdit : handleAddCategory}
              disabled={isAddButtonDisabled}
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {editingCategory && (
            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={() => {
                setEditingCategory(null);
                setNewCategoryName('');
              }}
            >
              <Text style={styles.cancelEditText}>Cancel Edit</Text>
            </TouchableOpacity>
          )}

          {/* Category List */}
          <View style={styles.categoriesList}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[styles.categoryColor, { backgroundColor: category.color }]}
                  />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity
                    style={styles.categoryActionButton}
                    onPress={() => handleEditCategory(category)}
                  >
                    <Edit size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryActionButton}
                    onPress={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About FocusNest</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Your personal time blocking companion for better focus and productivity.
          </Text>
        </View>

        {/* Reset Data */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleResetAllData}
            disabled={isResetting}
          >
            <Text style={styles.dangerButtonText}>
              {isResetting ? 'Resetting...' : 'Reset All Data'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dangerDescription}>
            This will delete all your blocks, reflections, and settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}