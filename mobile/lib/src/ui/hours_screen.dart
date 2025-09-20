import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'components/app_bar.dart';
import 'components/bottom_nav_bar.dart';
import 'components/card.dart';
import 'components/button.dart';

class HoursScreen extends ConsumerStatefulWidget {
  const HoursScreen({super.key});

  @override
  ConsumerState<HoursScreen> createState() => _HoursScreenState();
}

class _HoursScreenState extends ConsumerState<HoursScreen> {
  bool loading = true;
  List<Map<String, dynamic>> availabilityData = [];
  DateTime? selectedDate;
  TimeOfDay? startTime;
  TimeOfDay? endTime;
  String availabilityType = 'available';
  bool isAddingAvailability = false;

  final List<String> availabilityTypes = [
    'available',
    'busy',
    'unavailable',
  ];

  @override
  void initState() {
    super.initState();
    _loadAvailabilityData();
  }

  Future<void> _loadAvailabilityData() async {
    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      
      if (user == null) return;

      final response = await supabase
          .from('weekly_hours')
          .select('*')
          .eq('user_id', user.id)
          .order('week_start', ascending: false);

      setState(() {
        availabilityData = List<Map<String, dynamic>>.from(response);
        loading = false;
      });
    } catch (e) {
      setState(() {
        loading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading availability: $e')),
        );
      }
    }
  }

  Future<void> _addAvailability() async {
    if (selectedDate == null || startTime == null || endTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select date and time')),
      );
      return;
    }

    if (endTime!.hour < startTime!.hour || 
        (endTime!.hour == startTime!.hour && endTime!.minute <= startTime!.minute)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('End time must be after start time')),
      );
      return;
    }

    setState(() {
      isAddingAvailability = true;
    });

    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      
      if (user == null) return;

      final startDateTime = DateTime(
        selectedDate!.year,
        selectedDate!.month,
        selectedDate!.day,
        startTime!.hour,
        startTime!.minute,
      );
      
      final endDateTime = DateTime(
        selectedDate!.year,
        selectedDate!.month,
        selectedDate!.day,
        endTime!.hour,
        endTime!.minute,
      );

      // For now, we'll create a simple entry in weekly_hours
      // This is a simplified approach - in production you'd want a proper availability system
      final weekStart = _getWeekStart(selectedDate!);
      final dayOfWeek = selectedDate!.weekday;
      
      // Check if entry exists for this week
      final existing = await supabase
          .from('weekly_hours')
          .select('id')
          .eq('user_id', user.id)
          .eq('week_start', weekStart.toIso8601String().split('T')[0])
          .maybeSingle();
      
      if (existing != null) {
        // Update existing entry
        final updateData = <String, dynamic>{};
        final hours = endDateTime.difference(startDateTime).inHours;
        switch (dayOfWeek) {
          case 1: updateData['monday_hours'] = hours; break;
          case 2: updateData['tuesday_hours'] = hours; break;
          case 3: updateData['wednesday_hours'] = hours; break;
          case 4: updateData['thursday_hours'] = hours; break;
          case 5: updateData['friday_hours'] = hours; break;
          case 6: updateData['saturday_hours'] = hours; break;
          case 7: updateData['sunday_hours'] = hours; break;
        }
        
        await supabase
            .from('weekly_hours')
            .update(updateData)
            .eq('id', existing['id']);
      } else {
        // Create new entry
        final insertData = <String, dynamic>{
          'user_id': user.id,
          'week_start': weekStart.toIso8601String().split('T')[0],
          'monday_hours': 0,
          'tuesday_hours': 0,
          'wednesday_hours': 0,
          'thursday_hours': 0,
          'friday_hours': 0,
          'saturday_hours': 0,
          'sunday_hours': 0,
        };
        
        final hours = endDateTime.difference(startDateTime).inHours;
        switch (dayOfWeek) {
          case 1: insertData['monday_hours'] = hours; break;
          case 2: insertData['tuesday_hours'] = hours; break;
          case 3: insertData['wednesday_hours'] = hours; break;
          case 4: insertData['thursday_hours'] = hours; break;
          case 5: insertData['friday_hours'] = hours; break;
          case 6: insertData['saturday_hours'] = hours; break;
          case 7: insertData['sunday_hours'] = hours; break;
        }
        
        await supabase.from('weekly_hours').insert(insertData);
      }

      // Reset form
      setState(() {
        selectedDate = null;
        startTime = null;
        endTime = null;
        availabilityType = 'available';
      });

      // Reload data
      await _loadAvailabilityData();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Availability added successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error adding availability: $e')),
        );
      }
    } finally {
      setState(() {
        isAddingAvailability = false;
      });
    }
  }

  Future<void> _deleteAvailability(String id) async {
    try {
      final supabase = Supabase.instance.client;
      await supabase.from('weekly_hours').delete().eq('id', id);
      await _loadAvailabilityData();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Hours deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting hours: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F), // Black background
      appBar: CustomAppBar(
        title: 'Hours Tracking',
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: Colors.white),
            onPressed: () => _showAddAvailabilityDialog(),
          ),
        ],
      ),
      body: loading
          ? const Center(
              child: CircularProgressIndicator(
                color: Colors.white,
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadAvailabilityData,
              color: const Color(0xFF0F0F0F),
              backgroundColor: const Color(0xFF1A1A1A),
              child: availabilityData.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: availabilityData.length,
                      itemBuilder: (context, index) {
                        final availability = availabilityData[index];
                        return _buildAvailabilityCard(availability);
                      },
                    ),
            ),
      bottomNavigationBar: const CustomBottomNavBar(currentIndex: 2),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.access_time,
              size: 64,
              color: const Color(0xFF737373),
            ),
            const SizedBox(height: 16),
            const Text(
              'No availability logged',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tap the + button to add your availability',
              style: TextStyle(
                color: Color(0xFF737373),
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            CustomButton(
              text: 'Add Availability',
              icon: Icons.add,
              onPressed: () => _showAddAvailabilityDialog(),
              isFullWidth: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvailabilityCard(Map<String, dynamic> weeklyHours) {
    final weekStart = DateTime.parse(weeklyHours['week_start']);
    final totalHours = (weeklyHours['monday_hours'] ?? 0) +
                      (weeklyHours['tuesday_hours'] ?? 0) +
                      (weeklyHours['wednesday_hours'] ?? 0) +
                      (weeklyHours['thursday_hours'] ?? 0) +
                      (weeklyHours['friday_hours'] ?? 0) +
                      (weeklyHours['saturday_hours'] ?? 0) +
                      (weeklyHours['sunday_hours'] ?? 0);

    return CustomCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_view_week, color: Color(0xFF3B82F6), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Week of ${_formatDate(weekStart)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              PopupMenuButton(
                icon: const Icon(
                  Icons.more_vert,
                  color: Color(0xFF737373),
                ),
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Delete'),
                      ],
                    ),
                  ),
                ],
                onSelected: (value) {
                  if (value == 'delete') {
                    _deleteAvailability(weeklyHours['id']);
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.access_time, size: 16, color: Color(0xFF737373)),
              const SizedBox(width: 8),
              Text(
                'Total: ${totalHours}h',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 16, color: Color(0xFF737373)),
              const SizedBox(width: 8),
              Text(
                'Week of ${weekStart.day}/${weekStart.month}/${weekStart.year}',
                style: const TextStyle(
                  color: Color(0xFFA3A3A3),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showAddAvailabilityDialog() {
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF1A1A1A),
          title: const Text(
            'Add Availability',
            style: TextStyle(color: Colors.white),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.calendar_today, color: Color(0xFF737373)),
                  title: Text(
                    selectedDate == null 
                        ? 'Select Date' 
                        : _formatDate(selectedDate!),
                    style: const TextStyle(color: Colors.white),
                  ),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime.now().subtract(const Duration(days: 365)),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) {
                      setDialogState(() {
                        selectedDate = date;
                      });
                    }
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.schedule, color: Color(0xFF737373)),
                  title: Text(
                    startTime == null 
                        ? 'Start Time' 
                        : _formatTime(DateTime(2024, 1, 1, startTime!.hour, startTime!.minute)),
                    style: const TextStyle(color: Colors.white),
                  ),
                  onTap: () async {
                    final time = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay.now(),
                    );
                    if (time != null) {
                      setDialogState(() {
                        startTime = time;
                      });
                    }
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.schedule, color: Color(0xFF737373)),
                  title: Text(
                    endTime == null 
                        ? 'End Time' 
                        : _formatTime(DateTime(2024, 1, 1, endTime!.hour, endTime!.minute)),
                    style: const TextStyle(color: Colors.white),
                  ),
                  onTap: () async {
                    final time = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay.now(),
                    );
                    if (time != null) {
                      setDialogState(() {
                        endTime = time;
                      });
                    }
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: availabilityType,
                  dropdownColor: const Color(0xFF1A1A1A),
                  decoration: const InputDecoration(
                    labelText: 'Availability Type',
                    labelStyle: TextStyle(color: Color(0xFFA3A3A3)),
                    border: OutlineInputBorder(),
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(color: Color(0xFF262626)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(color: Color(0xFF0F0F0F)),
                    ),
                  ),
                  style: const TextStyle(color: Colors.white),
                  items: availabilityTypes.map((type) {
                    String label;
                    switch (type) {
                      case 'available':
                        label = 'Available';
                        break;
                      case 'busy':
                        label = 'Busy';
                        break;
                      case 'unavailable':
                        label = 'Unavailable';
                        break;
                      default:
                        label = type;
                    }
                    return DropdownMenuItem(
                      value: type,
                      child: Text(label, style: const TextStyle(color: Colors.white)),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setDialogState(() {
                      availabilityType = value!;
                    });
                  },
                ),
              ],
            ),
          ),
          actions: [
            CustomButton(
              text: 'Cancel',
              type: ButtonType.outline,
              onPressed: () => Navigator.of(context).pop(),
            ),
            CustomButton(
              text: 'Add',
              onPressed: isAddingAvailability ? null : _addAvailability,
              isLoading: isAddingAvailability,
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatTime(DateTime time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  DateTime _getWeekStart(DateTime date) {
    // Get Monday of the week
    final daysFromMonday = date.weekday - 1;
    return DateTime(date.year, date.month, date.day - daysFromMonday);
  }
}
