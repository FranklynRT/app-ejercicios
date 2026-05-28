import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Exercise {
  name: string;
  duration: number; // en segundos base
  description: string;
  intensity: 'Baja' | 'Media' | 'Alta';
}

interface Routine {
  id: string;
  title: string;
  icon: string;
  color: string;
  exercises: Exercise[];
}

type Difficulty = 'easy' | 'medium' | 'hard';

// Obtener string de fecha local YYYY-MM-DD
const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function WorkoutScreen() {
  const { theme: activeTheme, toggleTheme } = useAppTheme();
  const theme = Colors[activeTheme];

  // --- ESTADO GENERAL ---
  const [completedDays, setCompletedDays] = useState<string[]>(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    
    const d1 = `${currentYear}-${formattedMonth}-${String(Math.max(1, today.getDate() - 1)).padStart(2, '0')}`;
    const d2 = `${currentYear}-${formattedMonth}-${String(Math.max(1, today.getDate() - 3)).padStart(2, '0')}`;
    const d3 = `${currentYear}-${formattedMonth}-${String(Math.max(1, today.getDate() - 4)).padStart(2, '0')}`;
    const d4 = `${currentYear}-${formattedMonth}-${String(Math.max(1, today.getDate() - 7)).padStart(2, '0')}`;
    return [d1, d2, d3, d4];
  });

  // --- SELECCIÓN DE DIFICULTAD ---
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // --- RUTINAS DISPONIBLES ---
  const routines: Routine[] = [
    {
      id: 'full_body',
      title: 'Cuerpo Completo',
      icon: 'fitness',
      color: theme.primary,
      exercises: [
        { name: 'Burpees Explosivos', duration: 30, description: 'Salto explosivo, caída controlada y flexión profunda en el suelo.', intensity: 'Alta' },
        { name: 'Sentadillas Profundas', duration: 30, description: 'Desciende manteniendo la verticalidad del pecho e impulsando la cadera.', intensity: 'Media' },
        { name: 'Flexiones de Pecho', duration: 30, description: 'Codos replegados a 45 grados para proteger hombros y activar el core.', intensity: 'Media' },
        { name: 'Plancha Isométrica', duration: 30, description: 'Sostén la tensión abdominal total sin permitir oscilaciones de cadera.', intensity: 'Baja' },
      ],
    },
    {
      id: 'hiit_cardio',
      title: 'HIIT Cardio Quemador',
      icon: 'flame',
      color: theme.accent,
      exercises: [
        { name: 'Jumping Jacks', duration: 30, description: 'Coordinación dinámica abriendo y cerrando brazos y piernas.', intensity: 'Media' },
        { name: 'Rodillas al Pecho', duration: 30, description: 'Carrera estática elevando rodillas con máxima frecuencia.', intensity: 'Alta' },
        { name: 'Escaladores Dinámicos', duration: 30, description: 'Lleva tus rodillas alternadamente al pecho en posición de plancha.', intensity: 'Alta' },
        { name: 'Saltos del Patinador', duration: 30, description: 'Desplazamiento lateral explosivo amortiguando de forma controlada.', intensity: 'Alta' },
      ],
    },
    {
      id: 'fuerza_tono',
      title: 'Tonificación & Fuerza',
      icon: 'barbell',
      color: theme.secondary,
      exercises: [
        { name: 'Sentadilla con Salto', duration: 30, description: 'Fase excéntrica profunda seguida de un despegue vertical explosivo.', intensity: 'Alta' },
        { name: 'Flexiones Diamante', duration: 30, description: 'Junta tus dedos pulgares e índices para enfocar el esfuerzo en tus tríceps.', intensity: 'Alta' },
        { name: 'Zancadas Alternadas', duration: 30, description: 'Paso firme y largo al frente. La rodilla trasera roza suavemente el suelo.', intensity: 'Media' },
        { name: 'Fondos de Tríceps', duration: 30, description: 'Apoyo firme en banco flexionado los codos directamente hacia atrás.', intensity: 'Media' },
      ],
    },
  ];

  // --- REPRODUCTOR DE ENTRENAMIENTO ---
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerModalVisible, setTimerModalVisible] = useState<boolean>(false);
  const [congratsModalVisible, setCongratsModalVisible] = useState<boolean>(false);

  // --- FASE DE PREPARACIÓN DE 5S ---
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [prepTimeLeft, setPrepTimeLeft] = useState<number>(5);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- CALENDARIO ESTÁTICO PERO DINÁMICO (MES ACTUAL) ---
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }
    return days;
  }, [currentYear, currentMonth]);

  // --- CÁLCULO DE RACHA ---
  const streak = useMemo(() => {
    let currentStreak = 0;
    let checkDate = new Date();
    
    const todayStr = getLocalDateString(checkDate);
    const hasWorkedOutToday = completedDays.includes(todayStr);
    
    if (!hasWorkedOutToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
      const dateStr = getLocalDateString(checkDate);
      if (completedDays.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return hasWorkedOutToday ? currentStreak + 1 : currentStreak;
  }, [completedDays]);

  const getExerciseDuration = (baseDuration: number) => {
    switch (difficulty) {
      case 'easy':
        return 20;
      case 'medium':
        return 30;
      case 'hard':
        return 45;
    }
  };

  const toggleDayCompletion = (date: Date) => {
    const dateStr = getLocalDateString(date);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (completedDays.includes(dateStr)) {
      setCompletedDays(prev => prev.filter(d => d !== dateStr));
    } else {
      setCompletedDays(prev => [...prev, dateStr]);
    }
  };

  const startWorkout = (routine: Routine) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActiveRoutine(routine);
    setCurrentExerciseIndex(0);
    
    setIsPreparing(true);
    setPrepTimeLeft(5);
    setTimerModalVisible(true);
  };

  useEffect(() => {
    if (isPreparing && prepTimeLeft > 0) {
      prepTimerRef.current = setTimeout(() => {
        setPrepTimeLeft(prev => prev - 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 1000);
    } else if (isPreparing && prepTimeLeft === 0 && activeRoutine) {
      setIsPreparing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeLeft(getExerciseDuration(activeRoutine.exercises[0].duration));
      setTimerRunning(true);
    }
    return () => {
      if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    };
  }, [isPreparing, prepTimeLeft]);

  useEffect(() => {
    if (timerRunning && timeLeft > 0 && !isPreparing) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
        if (timeLeft <= 4 && timeLeft > 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 1000);
    } else if (timerRunning && timeLeft === 0 && activeRoutine && !isPreparing) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      if (currentExerciseIndex < activeRoutine.exercises.length - 1) {
        const nextIndex = currentExerciseIndex + 1;
        setCurrentExerciseIndex(nextIndex);
        setTimeLeft(getExerciseDuration(activeRoutine.exercises[nextIndex].duration));
      } else {
        finishWorkout();
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerRunning, timeLeft, isPreparing]);

  const finishWorkout = () => {
    setTimerRunning(false);
    setTimerModalVisible(false);
    
    const todayStr = getLocalDateString(new Date());
    if (!completedDays.includes(todayStr)) {
      setCompletedDays(prev => [...prev, todayStr]);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCongratsModalVisible(true);
  };

  const skipPrep = () => {
    if (!activeRoutine) return;
    setIsPreparing(false);
    if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeLeft(getExerciseDuration(activeRoutine.exercises[0].duration));
    setTimerRunning(true);
  };

  const pauseTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimerRunning(!timerRunning);
  };

  const skipExercise = () => {
    if (!activeRoutine) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentExerciseIndex < activeRoutine.exercises.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIndex);
      setTimeLeft(getExerciseDuration(activeRoutine.exercises[nextIndex].duration));
    } else {
      finishWorkout();
    }
  };

  const stopTimer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      '¿Deseas interrumpir la rutina?',
      'No se registrará el entrenamiento en tu calendario si sales antes de tiempo.',
      [
        { text: 'Seguir entrenando', style: 'cancel' },
        {
          text: 'Salir definitivamente',
          style: 'destructive',
          onPress: () => {
            setTimerRunning(false);
            setIsPreparing(false);
            setTimerModalVisible(false);
            setActiveRoutine(null);
          },
        },
      ]
    );
  };

  const activeExercise = activeRoutine ? activeRoutine.exercises[currentExerciseIndex] : null;
  const nextExercise = activeRoutine && currentExerciseIndex < activeRoutine.exercises.length - 1
    ? activeRoutine.exercises[currentExerciseIndex + 1]
    : null;

  const exerciseTimeLimit = activeExercise ? getExerciseDuration(activeExercise.duration) : 30;
  const progressPercent = activeRoutine && activeExercise 
    ? ((exerciseTimeLimit - timeLeft) / exerciseTimeLimit) * 100 
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme === 'dark' ? '#0A0A0C' : '#F6F6F9' }]}>
      <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Cabecera Deportiva con Estilo UI/UX Premium */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerGreeting, { color: theme.primary }]}>¡HOLA DE NUEVO! 👋</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Tu Progreso Diario</Text>
            <Text style={[styles.headerSubtitleText, { color: theme.icon }]}>Sigue entrenando para mantener tu racha</Text>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleTheme();
              }}
              style={[styles.themeToggleButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={activeTheme === 'light' ? 'moon-sharp' : 'sunny-sharp'}
                size={20}
                color={theme.primary}
              />
            </TouchableOpacity>
            <View style={[styles.avatarBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="fitness" size={20} color="#FFF" />
            </View>
          </View>
        </View>

        {/* Panel de Estadísticas Rápidas (UI/UX Balanced Grid) */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 94, 58, 0.12)' }]}>
              <Ionicons name="flame" size={22} color={theme.primary} />
            </View>
            <View style={styles.statInfoBox}>
              <Text style={[styles.statValue, { color: theme.text }]}>{streak}</Text>
              <Text style={[styles.statLabel, { color: theme.icon }]}>Racha activa</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(48, 209, 88, 0.12)' }]}>
              <Ionicons name="calendar-sharp" size={22} color={theme.success} />
            </View>
            <View style={styles.statInfoBox}>
              <Text style={[styles.statValue, { color: theme.text }]}>{completedDays.length}</Text>
              <Text style={[styles.statLabel, { color: theme.icon }]}>Registros</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(125, 122, 255, 0.12)' }]}>
              <Ionicons name="hourglass-sharp" size={22} color={theme.secondary} />
            </View>
            <View style={styles.statInfoBox}>
              <Text style={[styles.statValue, { color: theme.text }]}>{completedDays.length * 15}m</Text>
              <Text style={[styles.statLabel, { color: theme.icon }]}>Entrenado</Text>
            </View>
          </View>
        </View>

        {/* CALENDARIO DE ENTRENAMIENTOS (Estilo Frosted Minimalista) */}
        <View style={[styles.calendarCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.calendarHeader}>
            <View style={styles.calendarTitleContainer}>
              <View style={[styles.miniCircle, { backgroundColor: theme.primary }]} />
              <Text style={[styles.calendarTitle, { color: theme.text }]}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
            </View>
            <Text style={[styles.calendarSubtitle, { color: theme.icon }]}>
              Toca un día para alternar tu estado físico
            </Text>
          </View>

          <View style={styles.weekdayRow}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
              <Text key={idx} style={[styles.weekdayText, { color: theme.icon }]}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
              }

              const isCompleted = completedDays.includes(getLocalDateString(day));
              const isToday = getLocalDateString(day) === getLocalDateString(today);

              return (
                <TouchableOpacity
                  key={`day-${day.getDate()}`}
                  style={[
                    styles.calendarDayCell,
                    isCompleted && { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
                    isToday && !isCompleted && { borderWidth: 2, borderColor: theme.primary, backgroundColor: 'rgba(255, 94, 58, 0.05)' },
                  ]}
                  onPress={() => toggleDayCompletion(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumberText,
                      { color: isCompleted ? '#FFF' : theme.text },
                      isToday && !isCompleted && { color: theme.primary, fontWeight: '900' },
                      isCompleted && { fontWeight: '700' }
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                  {isCompleted && (
                    <View style={styles.sparklePoint} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.legendContainer, { borderTopColor: theme.border }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.legendLabel, { color: theme.icon }]}>Completado</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderWidth: 1.5, borderColor: theme.primary, backgroundColor: 'transparent' }]} />
              <Text style={[styles.legendLabel, { color: theme.icon }]}>Hoy</Text>
            </View>
          </View>
        </View>

        {/* SELECTOR DE DIFICULTAD (Pills UI/UX slider effect) */}
        <View style={[styles.difficultySelectorCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.difficultyHeaderRow}>
            <Ionicons name="options-outline" size={18} color={theme.primary} />
            <Text style={[styles.difficultyTitle, { color: theme.text }]}>Intensidad de Trabajo</Text>
          </View>
          <Text style={[styles.difficultySubtitle, { color: theme.icon }]}>
            Escala el tiempo de cada ejercicio de forma global
          </Text>
          <View style={[styles.segmentedControl, { backgroundColor: activeTheme === 'dark' ? '#0F0F12' : '#EBEBEF' }]}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => {
              const isActive = difficulty === level;
              const label = level === 'easy' ? 'Baja' : level === 'medium' ? 'Media' : 'Alta';
              const timeLabel = level === 'easy' ? '20s' : level === 'medium' ? '30s' : '45s';
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.segmentButton,
                    isActive && { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDifficulty(level);
                  }}
                  activeOpacity={0.9}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: isActive ? theme.text : theme.icon },
                      isActive && { fontWeight: '800' },
                    ]}
                  >
                    {label}
                  </Text>
                  <Text style={[styles.segmentSubtext, { color: isActive ? theme.primary : theme.icon }]}>
                    {timeLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SELECCIÓN DE RUTINAS (High-End visual items) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Rutinas de Entrenamiento</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.icon }]}>Selecciona un enfoque físico e inicia tu sesión rápida</Text>
        </View>

        {routines.map((routine) => (
          <TouchableOpacity
            key={routine.id}
            style={[styles.routineCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => startWorkout(routine)}
            activeOpacity={0.7}
          >
            <View style={[styles.routineIconBadge, { backgroundColor: 'rgba(255, 94, 58, 0.08)', borderRadius: 20 }]}>
              <Ionicons name={routine.icon as any} size={26} color={routine.color} />
            </View>
            <View style={styles.routineInfo}>
              <Text style={[styles.routineTitleText, { color: theme.text }]}>{routine.title}</Text>
              <Text style={[styles.routineSubText, { color: theme.icon }]}>
                {routine.exercises.length} bloques • Aprox. {Math.round(routine.exercises.length * getExerciseDuration(30) / 60)} min
              </Text>
              
              <View style={styles.exerciseTagsRow}>
                {routine.exercises.map((ex, idx) => (
                  <View key={idx} style={[styles.exerciseTag, { backgroundColor: activeTheme === 'dark' ? '#141416' : '#EBEBEF' }]}>
                    <Text style={[styles.exerciseTagText, { color: theme.text }]}>{ex.name}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[styles.playButtonWrapper, { backgroundColor: 'rgba(255, 94, 58, 0.08)' }]}>
              <Ionicons name="play" size={16} color={routine.color} style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.footerSpacing} />
      </ScrollView>

      {/* MODAL TEMPORIZADOR INTERACTIVO (Immersive Designer Style) */}
      <Modal
        visible={timerModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={[styles.timerContainer, { backgroundColor: activeTheme === 'dark' ? '#09090A' : '#FAFAFC' }]}>
          {activeRoutine && activeExercise && (
            <View style={styles.timerContent}>
              {/* Header del temporizador */}
              <View style={styles.timerHeader}>
                <View>
                  <Text style={[styles.timerRoutineTitle, { color: theme.icon }]}>
                    ENTRENAMIENTO ACTIVO
                  </Text>
                  <Text style={[styles.timerRoutineNameText, { color: theme.text }]}>
                    {activeRoutine.title}
                  </Text>
                </View>
                <TouchableOpacity onPress={stopTimer} style={[styles.closeTimerButton, { backgroundColor: theme.border }]}>
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* PANTALLA DE PREPARACIÓN DE 5S */}
              {isPreparing ? (
                <View style={styles.timerCenterContainer}>
                  <Text style={[styles.prepHeader, { color: theme.primary }]}>PREPÁRATE</Text>
                  <Text style={[styles.activeExerciseTitle, { color: theme.text }]}>
                    {activeExercise.name}
                  </Text>
                  
                  <View style={[styles.timerCircle, { borderColor: theme.primary, backgroundColor: 'rgba(255, 94, 58, 0.03)' }]}>
                    <Text style={[styles.timerValueText, { color: theme.text, fontSize: 80, fontWeight: '900' }]}>
                      {prepTimeLeft}
                    </Text>
                    <Text style={[styles.timerUnitText, { color: theme.icon }]}>segundos</Text>
                  </View>

                  <View style={[styles.exerciseDescBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Ionicons name="bulb-outline" size={22} color={theme.primary} />
                    <Text style={[styles.exerciseDescText, { color: theme.text }]}>
                      {activeExercise.description}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.skipPrepButton, { backgroundColor: theme.border }]}
                    onPress={skipPrep}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.skipPrepButtonText, { color: theme.text }]}>Comenzar ya</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // PANTALLA DE EJERCICIO EN CURSO (Pro Ring Interface)
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  {/* Progreso General */}
                  <View style={styles.progressTopBar}>
                    <View style={styles.progressTopTextRow}>
                      <Text style={[styles.progressTopText, { color: theme.icon }]}>
                        Bloque {currentExerciseIndex + 1} de {activeRoutine.exercises.length}
                      </Text>
                      <Text style={[styles.progressTopPercentText, { color: theme.primary }]}>
                        {Math.round(((currentExerciseIndex + 1) / activeRoutine.exercises.length) * 100)}%
                      </Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            backgroundColor: activeRoutine.color,
                            width: `${((currentExerciseIndex + 1) / activeRoutine.exercises.length) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Cuerpo del Temporizador */}
                  <View style={styles.timerCenterContainer}>
                    <Text style={[styles.activeExerciseTitle, { color: theme.text }]}>
                      {activeExercise.name}
                    </Text>
                    
                    <View style={[styles.intensityBadge, { backgroundColor: activeExercise.intensity === 'Alta' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(48, 209, 88, 0.1)' }]}>
                      <Text style={[styles.intensityText, { color: activeExercise.intensity === 'Alta' ? '#FF3B30' : theme.success }]}>
                        INTENSIDAD {activeExercise.intensity.toUpperCase()}
                      </Text>
                    </View>

                    {/* Círculo del Cronómetro */}
                    <View style={[styles.timerCircle, { borderColor: theme.border, borderWidth: 2 }]}>
                      <Text style={[styles.timerValueText, { color: theme.text }]}>
                        {timeLeft}
                      </Text>
                      <Text style={[styles.timerUnitText, { color: theme.icon }]}>segundos</Text>
                      
                      {/* Aro de progreso dinámico */}
                      <View style={[styles.circularProgressVisual, { backgroundColor: activeRoutine.color, width: `${progressPercent}%` }]} />
                    </View>

                    {/* Explicación del ejercicio */}
                    <View style={[styles.exerciseDescBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Ionicons name="flash-outline" size={20} color={activeRoutine.color} />
                      <Text style={[styles.exerciseDescText, { color: theme.text }]}>
                        {activeExercise.description}
                      </Text>
                    </View>

                    {/* Tarjeta de "Siguiente Ejercicio" */}
                    {nextExercise ? (
                      <View style={[styles.nextExerciseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.nextExerciseLabel, { color: theme.icon }]}>SIGUIENTE BLOQUE</Text>
                        <Text style={[styles.nextExerciseName, { color: theme.text }]}>{nextExercise.name}</Text>
                      </View>
                    ) : (
                      <View style={[styles.nextExerciseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.nextExerciseLabel, { color: theme.icon }]}>FINAL DE RUTINA</Text>
                        <Text style={[styles.nextExerciseName, { color: theme.success }]}>Último esfuerzo. ¡Da tu 100%!</Text>
                      </View>
                    )}
                  </View>

                  {/* Controles de reproducción */}
                  <View style={styles.timerControlsRow}>
                    <TouchableOpacity
                      onPress={stopTimer}
                      style={[styles.timerSubButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <Ionicons name="square" size={18} color="#FF3B30" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={pauseTimer}
                      style={[styles.timerMainPlayButton, { backgroundColor: activeRoutine.color, shadowColor: activeRoutine.color, shadowOpacity: 0.3 }]}
                    >
                      <Ionicons
                        name={timerRunning ? 'pause' : 'play'}
                        size={32}
                        color="#FFF"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={skipExercise}
                      style={[styles.timerSubButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <Ionicons name="play-forward" size={18} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* MODAL DE ENHORABUENA / FELICITACIONES (Pro Trophy popup) */}
      <Modal
        visible={congratsModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.congratsCard, { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20 }]}>
            <View style={styles.trophyContainer}>
              <View style={styles.trophyGlowRing} />
              <Ionicons name="trophy" size={70} color="#FFD700" />
            </View>
            <Text style={[styles.congratsTitle, { color: theme.text }]}>¡FANTÁSTICO TRABAJO!</Text>
            <Text style={[styles.congratsMessage, { color: theme.icon }]}>
              Has culminado la rutina de forma íntegra. El esfuerzo acumulado esculpe tus hábitos.
            </Text>

            <View style={[styles.badgeContainer, { backgroundColor: activeTheme === 'dark' ? '#141416' : '#EBEBEF' }]}>
              <Ionicons name="flame" size={20} color={theme.primary} />
              <Text style={[styles.badgeText, { color: theme.text }]}>
                Racha actual: <Text style={{ fontWeight: '800', color: theme.primary }}>{streak} días consecutivos 🔥</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.congratsButton, { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.3 }]}
              onPress={() => setCongratsModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.congratsButtonText}>Volver a entrenar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 12 : 4,
    marginBottom: 24,
  },
  headerGreeting: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerSubtitleText: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfoBox: {
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  calendarCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  calendarHeader: {
    marginBottom: 20,
  },
  calendarTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  calendarSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
    width: (width - 72) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDayCell: {
    width: (width - 72) / 7,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 19,
    position: 'relative',
  },
  dayNumberText: {
    fontSize: 12,
  },
  sparklePoint: {
    position: 'absolute',
    bottom: 4,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFF',
  },
  completedIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#30D158',
    borderRadius: 6,
    padding: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  difficultySelectorCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  difficultyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  difficultyTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  difficultySubtitle: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 14,
    fontWeight: '500',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    height: 48,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  segmentSubtext: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 3,
  },
  routineIconBadge: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  routineTitleText: {
    fontSize: 15,
    fontWeight: '850',
    letterSpacing: -0.1,
  },
  routineSubText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  exerciseTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 5,
  },
  exerciseTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  exerciseTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  playButtonWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  footerSpacing: {
    height: 100,
  },

  // ESTILOS DEL TEMPORIZADOR
  timerContainer: {
    flex: 1,
  },
  timerContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  timerRoutineTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  timerRoutineNameText: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  closeTimerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTopBar: {
    marginBottom: 24,
  },
  progressTopTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTopText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTopPercentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prepHeader: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  skipPrepButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 24,
  },
  skipPrepButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  activeExerciseTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  intensityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  intensityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timerCircle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  timerValueText: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -1,
  },
  timerUnitText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -4,
  },
  circularProgressVisual: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    opacity: 0.85,
  },
  exerciseDescBox: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  exerciseDescText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  nextExerciseCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  nextExerciseLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  nextExerciseName: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  timerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginVertical: 24,
  },
  timerSubButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerMainPlayButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },

  // ESTILOS DE FELICITACIONES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  congratsCard: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    elevation: 6,
  },
  trophyContainer: {
    marginBottom: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyGlowRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  congratsTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  congratsMessage: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  congratsButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  congratsButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
