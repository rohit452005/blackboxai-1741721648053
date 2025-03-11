// Store classes in localStorage
let classes = JSON.parse(localStorage.getItem('classes')) || [];

// Utility functions
function calculateAttendancePercentage(attended, total) {
    if (total === 0) return 0;
    return (attended / total) * 100;
}

function getAttendanceStatus(percentage) {
    if (percentage >= 75) {
        return {
            color: 'text-green-600',
            icon: 'fa-check-circle',
            message: 'Good Standing'
        };
    } else {
        return {
            color: 'text-red-600',
            icon: 'fa-exclamation-circle',
            message: 'Below Required'
        };
    }
}

function calculateClassesPerWeek(attendanceRecords) {
    if (!attendanceRecords.length) return 0;

    // Group classes by week
    const weeklyClasses = {};
    attendanceRecords.forEach(record => {
        const date = new Date(record.date);
        const weekNumber = getWeekNumber(date);
        const yearWeek = `${date.getFullYear()}-${weekNumber}`;
        
        if (!weeklyClasses[yearWeek]) {
            weeklyClasses[yearWeek] = 0;
        }
        weeklyClasses[yearWeek]++;
    });

    // Calculate average classes per week
    const totalWeeks = Object.keys(weeklyClasses).length;
    const totalClasses = Object.values(weeklyClasses).reduce((sum, count) => sum + count, 0);
    return totalWeeks > 0 ? (totalClasses / totalWeeks).toFixed(1) : 0;
}

function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// UI functions
function openAddClassModal() {
    document.getElementById('addClassModal').classList.remove('hidden');
}

function closeAddClassModal() {
    document.getElementById('addClassModal').classList.add('hidden');
    document.getElementById('addClassForm').reset();
}

function openMarkAttendanceModal(classId) {
    document.getElementById('markAttendanceModal').classList.remove('hidden');
    document.getElementById('attendanceClassId').value = classId;
    document.getElementById('attendanceDate').valueAsDate = new Date();
}

function closeMarkAttendanceModal() {
    document.getElementById('markAttendanceModal').classList.add('hidden');
    document.getElementById('markAttendanceForm').reset();
}

// Handle adding a new class
function handleAddClass(event) {
    event.preventDefault();
    
    const className = document.getElementById('className').value;
    
    const newClass = {
        id: Date.now().toString(),
        name: className,
        attendedSessions: 0,
        totalClasses: 0,
        attendanceRecords: []
    };
    
    classes.push(newClass);
    saveAndRenderClasses();
    closeAddClassModal();
    
    // Show success notification
    showNotification(`Class "${className}" added successfully!`, 'success');
}

// Handle marking attendance
function handleMarkAttendance(event) {
    event.preventDefault();
    
    const classId = document.getElementById('attendanceClassId').value;
    const date = document.getElementById('attendanceDate').value;
    const status = document.querySelector('input[name="status"]:checked').value;
    
    const classIndex = classes.findIndex(c => c.id === classId);
    if (classIndex === -1) return;
    
    // Check if attendance for this date already exists
    const existingRecord = classes[classIndex].attendanceRecords.find(
        record => record.date === date
    );
    
    if (existingRecord) {
        // Update existing record
        existingRecord.present = status === 'present';
    } else {
        // Add new record
        classes[classIndex].attendanceRecords.push({
            date,
            present: status === 'present'
        });
    }
    
    // Update attendance counts
    classes[classIndex].totalClasses = classes[classIndex].attendanceRecords.length;
    classes[classIndex].attendedSessions = classes[classIndex].attendanceRecords.filter(
        record => record.present
    ).length;
    
    saveAndRenderClasses();
    closeMarkAttendanceModal();
    
    // Show success notification
    showNotification('Attendance marked successfully!', 'success');
}

// Save to localStorage and render
function saveAndRenderClasses() {
    localStorage.setItem('classes', JSON.stringify(classes));
    renderClasses();
}

// Render classes to the grid
function renderClasses() {
    const classesGrid = document.getElementById('classesGrid');
    classesGrid.innerHTML = '';
    
    classes.forEach(classItem => {
        const attendancePercentage = calculateAttendancePercentage(
            classItem.attendedSessions,
            classItem.totalClasses
        );
        
        const status = getAttendanceStatus(attendancePercentage);
        const classesPerWeek = calculateClassesPerWeek(classItem.attendanceRecords);
        
        const classCard = document.createElement('div');
        classCard.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
        classCard.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-semibold text-gray-800">${classItem.name}</h3>
                <button onclick="deleteClass('${classItem.id}')" 
                    class="text-gray-400 hover:text-red-500 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Average Classes/Week:</span>
                    <span class="font-medium">${classesPerWeek}</span>
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Total Classes:</span>
                    <span class="font-medium">${classItem.totalClasses}</span>
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Classes Attended:</span>
                    <span class="font-medium">${classItem.attendedSessions}</span>
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Attendance:</span>
                    <span class="font-medium ${status.color}">
                        ${attendancePercentage.toFixed(1)}%
                    </span>
                </div>
                
                <div class="flex items-center ${status.color}">
                    <i class="fas ${status.icon} mr-2"></i>
                    <span>${status.message}</span>
                </div>
            </div>
            
            <button onclick="openMarkAttendanceModal('${classItem.id}')"
                class="mt-6 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Mark Attendance
            </button>
        `;
        
        classesGrid.appendChild(classCard);
    });
}

// Delete a class
function deleteClass(classId) {
    if (!confirm('Are you sure you want to delete this class?')) return;
    
    classes = classes.filter(c => c.id !== classId);
    saveAndRenderClasses();
    showNotification('Class deleted successfully!', 'success');
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    renderClasses();
});
