import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { Palette, Bell, User, Moon, Sun, Plus, Trash2, CreditCard as Edit } from 'lucide-react-native';
import { loadCategories, saveCategories, BlockCategory } from '@/utils/storage';

export default function SettingsScreen() {
  const [categories, setCategories] = useState<BlockCategory[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '17:00' });
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [editingCategory, setEditingCategory] = useState<BlockCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedCategories = await loadCategories();
    setCategories(savedCategories);
  };

  const handleAddCategory = () => {
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
    saveCategories(updatedCategories);
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
          onPress: () => {
            const updatedCategories = categories.filter(c => c.id !== categoryId);
            setCategories(updatedCategories);
            saveCategories(updatedCategories);
          }
        }
      ]
    );
  };

  const handleEditCategory = (category: BlockCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    const updatedCategories = categories.map(c =>
      c.id === editingCategory.id
        ? { ...c, name: newCategoryName.trim() }
        : c
    );
    
    setCategories(updatedCategories);
    saveCategories(updatedCategories);
    setEditingCategory(null);
    setNewCategoryName('');
  };

  const durations = [30, 45, 60, 90, 120];

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
            {isDarkMode ? <Moon size={20} color="#FF6B35" /> : <Sun size={20} color="#FF6B35" />}
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#E8DCC0', true: '#FF6B35' }}
              thumbColor={isDarkMode ? '#FFF' : '#FFF'}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#2E8B8B" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E8DCC0', true: '#2E8B8B' }}
              thumbColor={notificationsEnabled ? '#FFF' : '#FFF'}
            />
          </View>
          
          <Text style={styles.settingDescription}>
            Get reminders when blocks start and end
          </Text>
        </View>

        {/* Working Hours */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#8B4F9F" />
            <Text style={styles.sectionTitle}>Working Hours</Text>
          </View>
          
          <View style={styles.timeInputContainer}>
            <View style={styles.timeInputGroup}>
              <Text style={styles.timeLabel}>Start</Text>
              <TextInput
                style={styles.timeInput}
                value={workingHours.start}
                onChangeText={(text) => setWorkingHours({ ...workingHours, start: text })}
                placeholder="09:00"
              />
            </View>
            <Text style={styles.timeSeparator}>to</Text>
            <View style={styles.timeInputGroup}>
              <Text style={styles.timeLabel}>End</Text>
              <TextInput
                style={styles.timeInput}
                value={workingHours.end}
                onChangeText={(text) => setWorkingHours({ ...workingHours, end: text })}
                placeholder="17:00"
              />
            </View>
          </View>
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
                  defaultDuration === duration && styles.selectedDuration
                ]}
                onPress={() => setDefaultDuration(duration)}
              >
                <Text
                  style={[
                    styles.durationText,
                    defaultDuration === duration && styles.selectedDurationText
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
            <Palette size={20} color="#4F8B3B" />
            <Text style={styles.sectionTitle}>Block Categories</Text>
          </View>
          
          {/* Add New Category */}
          <View style={styles.addCategoryContainer}>
            <TextInput
              style={styles.categoryInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Add new category..."
            />
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={editingCategory ? handleSaveEdit : handleAddCategory}
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
                    <Edit size={16} color="#8B7355" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryActionButton}
                    onPress={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 size={16} color="#FF4444" />
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
          <TouchableOpacity style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>Reset All Data</Text>
          </TouchableOpacity>
          <Text style={styles.dangerDescription}>
            This will delete all your blocks, reflections, and settings.
          </Text>
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
  section: {
    backgroundColor: '#FFF8E7',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8DCC0',
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
    color: '#2A1810',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#2A1810',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#F5F1E8',
    borderWidth: 1,
    borderColor: '#E8DCC0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2A1810',
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#8B7355',
    fontWeight: '500',
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
    backgroundColor: '#F5F1E8',
    borderWidth: 1,
    borderColor: '#E8DCC0',
    alignItems: 'center',
  },
  selectedDuration: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
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
    backgroundColor: '#F5F1E8',
    borderWidth: 1,
    borderColor: '#E8DCC0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2A1810',
  },
  addCategoryButton: {
    backgroundColor: '#4F8B3B',
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelEditText: {
    color: '#FF4444',
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
    color: '#2A1810',
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
    color: '#8B7355',
    fontWeight: '600',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerDescription: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
  },
});