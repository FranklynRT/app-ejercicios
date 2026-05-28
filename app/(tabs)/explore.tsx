import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  PixelRatio,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Responsive scaling based on device width (baseline 375dp)
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375;
const normalize = (size: number) => {
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

const { width } = Dimensions.get('window');

interface QuizQuestion {
  question: string;
  options: {
    text: string;
    type: 'ectomorfo' | 'mesomorfo' | 'endomorfo';
    icon: string;
  }[];
}

interface ApiExercise {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
}

// Diccionarios de traducción para mantener una UI/UX Premium impecable en español
const translateMuscle = (muscle: string): string => {
  if (!muscle) return 'Desconocido';
  const mapping: Record<string, string> = {
    abdominals: 'Abdomen',
    abductors: 'Abductores',
    adductors: 'Aductores',
    biceps: 'Bíceps',
    calves: 'Pantorrillas',
    chest: 'Pecho / Pectoral',
    forearms: 'Antebrazos',
    glutes: 'Glúteos',
    hamstrings: 'Femorales / Isquiotibiales',
    lats: 'Dorsales',
    lower_back: 'Espalda Baja',
    middle_back: 'Espalda Media',
    neck: 'Cuello',
    quadriceps: 'Cuádriceps',
    traps: 'Trapecios',
    triceps: 'Tríceps',
  };
  return mapping[muscle.toLowerCase()] || muscle;
};

const translateEquipment = (equip: string): string => {
  if (!equip) return 'Desconocido';
  const mapping: Record<string, string> = {
    barbell: 'Barra',
    dumbbell: 'Mancuernas',
    body_only: 'Peso Corporal',
    cable: 'Polea / Cable',
    machine: 'Máquina',
    kettlebells: 'Pesa Rusa (Kettlebell)',
    bands: 'Bandas de Resistencia',
    medicine_ball: 'Balón Medicinal',
    other: 'Otro Equipamiento',
  };
  return mapping[equip.toLowerCase()] || equip;
};

const translateDifficulty = (diff: string): string => {
  if (!diff) return 'Desconocido';
  const mapping: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    expert: 'Avanzado / Experto',
  };
  return mapping[diff.toLowerCase()] || diff;
};
const translateType = (type: string): string => {
  if (!type) return 'Desconocido';
  const mapping: Record<string, string> = {
    cardio: 'Cardio',
    olympic_weightlifting: 'Levantamiento Olímpico',
    plyometrics: 'Pliometría',
    powerlifting: 'Powerlifting',
    strength: 'Fuerza',
    stretching: 'Estiramiento',
    strongman: 'Strongman',
  };
  return mapping[type.toLowerCase()] || type;
};

export default function ExploreScreen() {
  const { theme: activeTheme } = useAppTheme();
  const theme = Colors[activeTheme];

  // --- SECCIÓN ACTIVA ('recomendador' o 'test') ---
  const [activeTab, setActiveTab] = useState<'recomendador' | 'test'>('recomendador');

  // --- CONTROL DEL TEST ---
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<('ectomorfo' | 'mesomorfo' | 'endomorfo')[]>([]);
  const [testResult, setTestResult] = useState<'ectomorfo' | 'mesomorfo' | 'endomorfo' | null>(null);

  // --- BIOTIPO SELECCIONADO EN EL VISUALIZADOR ---
  const [selectedBiotipo, setSelectedBiotipo] = useState<'ectomorfo' | 'mesomorfo' | 'endomorfo'>('ectomorfo');

  // --- ESTADOS DE LA API DE EJERCICIOS ---
  const [apiExercises, setApiExercises] = useState<ApiExercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchActive, setSearchActive] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const quizQuestions: QuizQuestion[] = [
    {
      question: '1. ¿Cómo describirías tu estructura ósea y complexión natural?',
      options: [
        { text: 'Delgada, con hombros estrechos y articulaciones pequeñas (muñecas finas).', type: 'ectomorfo', icon: 'resize-outline' },
        { text: 'Atlética, hombros de ancho medio a amplio, complexión simétrica.', type: 'mesomorfo', icon: 'body-outline' },
        { text: 'Robusta y fuerte, con hombros anchos, caderas más anchas y extremidades pesadas.', type: 'endomorfo', icon: 'grid-outline' },
      ],
    },
    {
      question: '2. Al ganar peso y masa muscular, ¿cuál es tu tendencia natural?',
      options: [
        { text: 'Dificultad extrema para ganar peso o músculo, sin importar cuánto coma.', type: 'ectomorfo', icon: 'trending-up-outline' },
        { text: 'Gano músculo rápidamente y controlo la grasa corporal con relativa facilidad.', type: 'mesomorfo', icon: 'shield-checkmark-outline' },
        { text: 'Gano peso y grasa con mucha facilidad, pero me cuesta mucho perder grasa.', type: 'endomorfo', icon: 'trending-down-outline' },
      ],
    },
    {
      question: '3. ¿Cómo se distribuye la grasa en tu cuerpo habitualmente?',
      options: [
        { text: 'Tengo muy poca grasa, mi cuerpo es lineal y estilizado por naturaleza.', type: 'ectomorfo', icon: 'git-commit-outline' },
        { text: 'Distribución uniforme y atlética. La grasa no se acumula de forma exagerada.', type: 'mesomorfo', icon: 'checkmark-circle-outline' },
        { text: 'Se acumula rápidamente en el abdomen, muslos o caderas, dando una forma redonda.', type: 'endomorfo', icon: 'pie-chart-outline' },
      ],
    },
  ];

  // --- DATOS BÁSICOS DEL BIOTIPO ---
  const biotiposMeta = {
    ectomorfo: {
      title: 'Ectomorfo',
      subtitle: 'El Metabolismo Ultra-Rápido',
      badgeColor: theme.primary,
      desc: 'Los ectomorfos son delgados por naturaleza, con estructura ósea ligera, articulaciones estrechas y un metabolismo sumamente veloz que quema calorías a gran velocidad. Su principal reto es la síntesis de proteína y el incremento de masa muscular magra (hipertrofia).',
      percentage: { fuerza: 80, cardio: 20 },
      guidelines: [
        'Priorizar entrenamientos de fuerza con cargas elevadas de carácter muscular compuesto.',
        'Limitar las sesiones de cardio para evitar pérdidas indeseadas de masa muscular.',
        'Sostener descansos de 2 a 3 minutos entre series pesadas.',
        'Llevar un superávit de carbohidratos complejos y proteínas.',
      ],
      diet: 'Superávit calórico controlado. 50% Carbohidratos complejos, 30% Proteínas magras, 20% Grasas insaturadas.',
      muscleQuery: 'quadriceps', // Muscle clave de consulta API
    },
    mesomorfo: {
      title: 'Mesomorfo',
      subtitle: 'La Genética Deportiva',
      badgeColor: theme.secondary,
      desc: 'El biotipo mesomorfo es el estándar atlético natural. Presentan clavículas anchas, cintura estrecha y una predisposición excelente para la ganancia muscular y pérdida de grasa. Su recuperación es rápida, permitiendo un volumen de entrenamiento exigente.',
      percentage: { fuerza: 60, cardio: 40 },
      guidelines: [
        'Utilizar periodización mixta (fuerza, hipertrofia y potencia).',
        'Variar las rutinas dinámicamente para romper adaptaciones.',
        'Añadir pliometría y sprints HIIT para conservar definición.',
        'Respetar los tiempos de descanso y no exceder los límites.',
      ],
      diet: 'Dieta equilibrada. 40% Carbohidratos complejos, 35% Proteínas aisladas, 25% Grasas de alta calidad.',
      muscleQuery: 'shoulders', // Muscle clave
    },
    endomorfo: {
      title: 'Endomorfo',
      subtitle: 'La Estructura Fuerte y Robusta',
      badgeColor: theme.accent,
      desc: 'Los endomorfos poseen una estructura corporal robusta, hombros anchos y caderas fuertes con un metabolismo más lento. Cuentan con una facilidad natural asombrosa para desarrollar fuerza muscular, pero su reto reside en la retención lipídica.',
      percentage: { fuerza: 40, cardio: 60 },
      guidelines: [
        'Realizar entrenamientos metabólicos de alta densidad con descansos cortos.',
        'Aumentar el rango de repeticiones (12-15 reps) con cargas controladas.',
        'Incrementar la actividad cardiovascular (HIIT y LISS) de manera constante.',
        'Mantener un estilo de vida activo diariamente aumentando pasos.',
      ],
      diet: 'Déficit calórico leve controlado. 25% Carbohidratos fibrosos, 45% Proteínas, 30% Grasas sanas.',
      muscleQuery: 'abdominals', // Muscle clave
    },
  };

  const activeBiotipoMeta = biotiposMeta[selectedBiotipo];

  // --- FUNCIÓN PARA CONSULTAR LA API ---
  const fetchExercisesFromApi = async (muscle: string, isSearch: boolean = false, queryName: string = '') => {
    setIsLoading(true);
    setApiError(null);
    try {
      let url = `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}`;
      if (isSearch && queryName) {
        // La API permite buscar por nombre directamente
        url = `https://api.api-ninjas.com/v1/exercises?name=${encodeURIComponent(queryName)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': '***REMOVED***',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al conectar con el servidor de ejercicios.');
      }

      const data = await response.json();

      // Limitar a los primeros 4 ejercicios para mantener la UI limpia y organizada
      setApiExercises(data.slice(0, 4));
    } catch (error: any) {
      console.error(error);
      setApiError('No pudimos cargar ejercicios en vivo. Revisa tu conexión a internet.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar ejercicios recomendados según el biotipo seleccionado por defecto
  useEffect(() => {
    if (!searchActive) {
      fetchExercisesFromApi(activeBiotipoMeta.muscleQuery);
    }
  }, [selectedBiotipo, searchActive]);

  // --- GESTIÓN DE BÚSQUEDA ---
  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) {
      setSearchActive(false);
      fetchExercisesFromApi(activeBiotipoMeta.muscleQuery);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSearchActive(true);
    // Intentar buscar directamente por nombre
    fetchExercisesFromApi('', true, searchQuery.trim());
  };

  const clearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setSearchActive(false);
    fetchExercisesFromApi(activeBiotipoMeta.muscleQuery);
  };

  // --- GESTIÓN DEL TEST ---
  const handleAnswerSelection = (type: 'ectomorfo' | 'mesomorfo' | 'endomorfo') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newAnswers = [...answers, type];
    setAnswers(newAnswers);

    if (currentQuestionIdx < quizQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      const counts = newAnswers.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {} as Record<'ectomorfo' | 'mesomorfo' | 'endomorfo', number>);

      let dominantType: 'ectomorfo' | 'mesomorfo' | 'endomorfo' = 'ectomorfo';
      let maxCount = 0;

      (Object.keys(counts) as Array<'ectomorfo' | 'mesomorfo' | 'endomorfo'>).forEach(key => {
        if (counts[key] > maxCount) {
          maxCount = counts[key];
          dominantType = key;
        }
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTestResult(dominantType);
    }
  };

  const restartQuiz = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentQuestionIdx(0);
    setAnswers([]);
    setTestResult(null);
  };

  const viewResultDetails = () => {
    if (testResult) {
      setSelectedBiotipo(testResult);
      setActiveTab('recomendador');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme === 'dark' ? '#0A0A0C' : '#F6F6F9' }]}>
      <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Pestañas superiores estilizadas en Cápsula (UI/UX Sliding effect) */}
      <View style={[styles.tabsOuterContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.tabsInnerContainer, { backgroundColor: activeTheme === 'dark' ? '#141416' : '#EBEBEF' }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'recomendador' && { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('recomendador');
            }}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'recomendador' ? theme.text : theme.icon },
                activeTab === 'recomendador' && { fontWeight: '800' },
              ]}
            >
              Tipos de Cuerpo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'test' && { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('test');
            }}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'test' ? theme.text : theme.icon },
                activeTab === 'test' && { fontWeight: '800' },
              ]}
            >
              ¿Cuál es mi Biotipo?
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'recomendador' ? (
          // PESTAÑA 1: VISUALIZADOR Y RECOMENDADOR CON API
          <View>
            <View style={styles.introBox}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Guía de Ejercicios por Biotipo</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.icon }]}>
                Conectado en vivo con la biblioteca de ejercicios API Ninjas para entregarte entrenamientos reales y detallados.
              </Text>
            </View>

            {/* Barra de Búsqueda UI/UX de Ejercicios */}
            <View style={[styles.searchBoxCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.searchBarContainer, { backgroundColor: activeTheme === 'dark' ? '#141416' : '#EBEBEF' }]}>
                <Ionicons name="search" size={18} color={theme.icon} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Busca ejercicios (ej: squat, pushup, biceps)..."
                  placeholderTextColor={theme.icon}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchSubmit}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                    <Ionicons name="close-circle" size={18} color={theme.icon} />
                  </TouchableOpacity>
                )}
              </View>
              {searchActive && (
                <View style={styles.searchLabelRow}>
                  <Text style={[styles.searchActiveLabel, { color: theme.primary }]}>
                    Mostrando resultados de búsqueda para "{searchQuery}"
                  </Text>
                </View>
              )}
            </View>

            {/* Selector de Biotipos (Solo si no hay una búsqueda activa para evitar confusión) */}
            {!searchActive && (
              <View style={styles.selectorRow}>
                {(Object.keys(biotiposMeta) as Array<keyof typeof biotiposMeta>).map((key) => {
                  const isSelected = selectedBiotipo === key;
                  const data = biotiposMeta[key];
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.selectorCard,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        isSelected && { borderColor: data.badgeColor, borderWidth: 2, shadowColor: data.badgeColor, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedBiotipo(key);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={key === 'ectomorfo' ? 'accessibility-sharp' : key === 'mesomorfo' ? 'fitness-sharp' : 'grid-sharp'}
                        size={20}
                        color={isSelected ? data.badgeColor : theme.icon}
                      />
                      <Text
                        style={[
                          styles.selectorLabel,
                          { color: isSelected ? theme.text : theme.icon },
                          isSelected && { fontWeight: '800' },
                        ]}
                      >
                        {data.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Ficha Informativa del Biotipo */}
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {!searchActive ? (
                // Información anatómica general del biotipo seleccionado
                <View>
                  <View style={styles.infoCardHeader}>
                    <View style={[styles.biotipoBadge, { backgroundColor: activeBiotipoMeta.badgeColor }]}>
                      <Text style={styles.biotipoBadgeText}>{activeBiotipoMeta.title.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.biotipoSubtitle, { color: theme.icon }]}>{activeBiotipoMeta.subtitle}</Text>
                  </View>

                  <Text style={[styles.biotipoDescText, { color: theme.text }]}>
                    {activeBiotipoMeta.desc}
                  </Text>

                  {/* Porcentajes (Fuerza vs Cardio) */}
                  <Text style={[styles.subSectionTitle, { color: theme.text, marginTop: 24 }]}>
                    Esquema de Entrenamiento Recomendado
                  </Text>
                  <View style={styles.focusBarContainer}>
                    <View style={styles.focusBarLabels}>
                      <Text style={[styles.focusLabelText, { color: theme.text }]}>
                        Fuerza / Hipertrofia ({activeBiotipoMeta.percentage.fuerza}%)
                      </Text>
                      <Text style={[styles.focusLabelText, { color: theme.text }]}>
                        Cardio / Resistencia ({activeBiotipoMeta.percentage.cardio}%)
                      </Text>
                    </View>
                    <View style={[styles.focusBarProgressBg, { backgroundColor: activeTheme === 'dark' ? '#0F0F12' : '#EBEBEF' }]}>
                      <View
                        style={[
                          styles.focusBarProgressFill,
                          {
                            width: `${activeBiotipoMeta.percentage.fuerza}%`,
                            backgroundColor: theme.primary,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.focusBarProgressFillRight,
                          {
                            width: `${activeBiotipoMeta.percentage.cardio}%`,
                            backgroundColor: theme.secondary,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Pilares */}
                  <Text style={[styles.subSectionTitle, { color: theme.text, marginTop: 24 }]}>
                    Pilares del Entrenamiento
                  </Text>
                  {activeBiotipoMeta.guidelines.map((rule, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <View style={[styles.bulletPoint, { backgroundColor: activeBiotipoMeta.badgeColor }]} />
                      <Text style={[styles.bulletText, { color: theme.text }]}>{rule}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                // Cabecera en estado de búsqueda
                <View style={styles.infoCardHeader}>
                  <Text style={[styles.biotipoSubtitle, { color: theme.text, fontSize: 16 }]}>
                    Resultados de Biblioteca de Ejercicios en Vivo
                  </Text>
                </View>
              )}

              {/* EJERCICIOS DINÁMICOS FETCHED DE LA API NINJAS */}
              <Text style={[styles.subSectionTitle, { color: theme.text, marginTop: 24 }]}>
                {searchActive ? 'Ejercicios Encontrados' : `Ejercicios Sugeridos (Musculación: ${translateMuscle(activeBiotipoMeta.muscleQuery)})`}
              </Text>

              {/* Manejo de estados de Carga / Error */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.icon }]}>Consultando API Ninjas en tiempo real...</Text>
                </View>
              ) : apiError ? (
                <View style={[styles.errorBox, { backgroundColor: 'rgba(255, 59, 48, 0.08)', borderColor: 'rgba(255, 59, 48, 0.2)' }]}>
                  <Ionicons name="cloud-offline-outline" size={24} color="#FF3B30" />
                  <Text style={[styles.errorTextText, { color: theme.text }]}>{apiError}</Text>
                  <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: theme.primary }]}
                    onPress={() => fetchExercisesFromApi(searchActive ? '' : activeBiotipoMeta.muscleQuery, searchActive, searchQuery)}
                  >
                    <Text style={styles.retryButtonText}>Reintentar carga</Text>
                  </TouchableOpacity>
                </View>
              ) : apiExercises.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="file-tray-sharp" size={36} color={theme.icon} />
                  <Text style={[styles.emptyText, { color: theme.icon }]}>No se encontraron ejercicios en la base de datos de API Ninjas para esta consulta.</Text>
                </View>
              ) : (
                // Lista de ejercicios dinámicos de la API con diseño de alta calidad
                apiExercises.map((ex, idx) => (
                  <View key={idx} style={[styles.exerciseDetailCard, { backgroundColor: activeTheme === 'dark' ? '#0A0A0C' : '#F6F6F9', borderColor: theme.border }]}>
                    <View style={styles.exerciseDetailHeader}>
                      <View style={[styles.exerciseIconBox, { backgroundColor: 'rgba(255, 94, 58, 0.08)' }]}>
                        <Ionicons name="barbell-sharp" size={20} color={searchActive ? theme.primary : activeBiotipoMeta.badgeColor} />
                      </View>
                      <View style={styles.exerciseDetailTitleRow}>
                        <Text style={[styles.exerciseDetailName, { color: theme.text }]}>{ex.name}</Text>
                        <Text style={[styles.exerciseDetailMuscles, { color: theme.icon }]}>
                          🎯 Musculatura: {translateMuscle(ex.muscle)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.badgesRow}>
                      <View style={[styles.repsBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.repsText, { color: theme.primary }]}>
                          🛠️ Equipo: {Array.isArray(ex.equipment) ? ex.equipment.map(e => translateEquipment(e)).join(', ') : translateEquipment(ex.equipment)}
                        </Text>
                      </View>
                      <View style={[styles.repsBadge, { backgroundColor: theme.card, borderColor: theme.border, marginLeft: 6 }]}>
                        <Text style={[styles.repsText, { color: theme.secondary }]}>
                          📈 Nivel: {translateDifficulty(ex.difficulty)}
                        </Text>
                      </View>
                    </View>

                    {/* Instrucciones del ejercicio de la API */}
                    <Text style={[styles.instructionsHeader, { color: theme.icon }]}>INSTRUCCIONES DE EJECUCIÓN:</Text>
                    <Text style={[styles.exerciseDetailDesc, { color: theme.text }]}>
                      {ex.instructions || 'No hay instrucciones detalladas cargadas para este ejercicio.'}
                    </Text>
                  </View>
                ))
              )}

              {/* Sección de nutrición (Solo si no es búsqueda para mantener relevancia) */}
              {!searchActive && (
                <View>
                  <Text style={[styles.subSectionTitle, { color: theme.text, marginTop: 24 }]}>
                    Nutrición y Plan de Alimentación Sugerido
                  </Text>
                  <View style={[styles.dietBox, { backgroundColor: activeTheme === 'dark' ? '#0A0A0C' : '#F6F6F9', borderColor: theme.border }]}>
                    <Ionicons name="restaurant-sharp" size={20} color={activeBiotipoMeta.badgeColor} />
                    <Text style={[styles.dietText, { color: theme.text }]}>{activeBiotipoMeta.diet}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        ) : (
          // PESTAÑA 2: TEST DE BIOTIPOS (100% Organizado y Centrado)
          <View>
            {!testResult ? (
              <View style={[styles.quizCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.quizHeader}>
                  <Text style={[styles.quizProgressText, { color: theme.icon }]}>
                    PREGUNTA {currentQuestionIdx + 1} DE {quizQuestions.length}
                  </Text>
                  <View style={[styles.progressBarBg, { backgroundColor: activeTheme === 'dark' ? '#0F0F12' : '#EBEBEF' }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: theme.primary,
                          width: `${((currentQuestionIdx + 1) / quizQuestions.length) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                <Text style={[styles.quizQuestionText, { color: theme.text }]}>
                  {quizQuestions[currentQuestionIdx].question}
                </Text>

                <View style={styles.optionsContainer}>
                  {quizQuestions[currentQuestionIdx].options.map((option, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.optionCard, { backgroundColor: activeTheme === 'dark' ? '#0A0A0C' : '#F6F6F9', borderColor: theme.border }]}
                      onPress={() => handleAnswerSelection(option.type)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.optionIconContainer, { backgroundColor: theme.card }]}>
                        <Ionicons name={option.icon as any} size={20} color={theme.primary} />
                      </View>
                      <Text style={[styles.optionText, { color: theme.text }]}>
                        {option.text}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.icon} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              // Resultados del Test
              <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.successIconWrapper}>
                  <View style={styles.trophyGlowRing} />
                  <Ionicons name="sparkles" size={54} color="#FFD700" />
                </View>

                <Text style={[styles.resultSubtitle, { color: theme.icon }]}>
                  DIAGNÓSTICO CORPORAL
                </Text>
                <Text style={[styles.resultTitleText, { color: theme.text }]}>
                  Cuerpo {biotiposMeta[testResult].title}
                </Text>

                <View style={[styles.biotipoDescriptionBox, { backgroundColor: activeTheme === 'dark' ? '#141416' : '#EBEBEF' }]}>
                  <Text style={[styles.biotipoDescriptionText, { color: theme.text }]}>
                    {biotiposMeta[testResult].desc}
                  </Text>
                </View>

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={[styles.resultButton, { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.25 }]}
                    onPress={viewResultDetails}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resultButtonText}>Ver ejercicios específicos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.resultSubButton, { borderColor: theme.border, backgroundColor: theme.background }]}
                    onPress={restartQuiz}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.resultSubButtonText, { color: theme.text }]}>Repetir test</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsOuterContainer: {
    borderBottomWidth: 1,
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(10),
  },
  tabsInnerContainer: {
    flexDirection: 'row',
    borderRadius: normalize(16),
    padding: normalize(3),
    height: normalize(44),
  },
  tabButton: {
    flex: 1,
    borderRadius: normalize(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: normalize(13),
    fontWeight: '600',
  },
  scrollContent: {
    padding: normalize(20),
  },
  introBox: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
  },
  searchBoxCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 6,
  },
  clearSearchButton: {
    padding: 4,
  },
  searchLabelRow: {
    marginTop: 10,
  },
  searchActiveLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  selectorCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  selectorLabel: {
    fontSize: 10.5,
    fontWeight: '650',
    marginTop: 2,
  },
  infoCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
    paddingBottom: 12,
    marginBottom: 16,
  },
  biotipoBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  biotipoBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  biotipoSubtitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  biotipoDescText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  focusBarContainer: {
    gap: 6,
  },
  focusBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  focusLabelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  focusBarProgressBg: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  focusBarProgressFill: {
    height: '100%',
  },
  focusBarProgressFillRight: {
    height: '100%',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },

  // ESTILOS DE FICHA DE EJERCICIO PRO API
  exerciseDetailCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  exerciseDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseDetailTitleRow: {
    flex: 1,
  },
  exerciseDetailName: {
    fontSize: normalize(15),
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  exerciseDetailMuscles: {
    fontSize: normalize(11),
    fontWeight: '600',
    marginTop: normalize(2),
  },
  badgesRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  repsBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  repsText: {
    fontSize: normalize(10),
    fontWeight: '800',
  },
  instructionsHeader: {
    fontSize: normalize(9),
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: normalize(6),
  },
  exerciseDetailDesc: {
    fontSize: normalize(12),
    lineHeight: normalize(18),
    fontWeight: '550',
  },

  dietBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  dietText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  // ESTILOS DE CARGA / ERROR / VACÍO
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '650',
    marginTop: 14,
  },
  errorBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  errorTextText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '650',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // ESTILOS DEL QUIZ
  quizCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  quizHeader: {
    marginBottom: 20,
  },
  quizProgressText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
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
  quizQuestionText: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '650',
    lineHeight: 16,
  },

  // RESULTADOS DEL QUIZ
  resultCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  successIconWrapper: {
    marginBottom: 16,
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  trophyGlowRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  resultSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  resultTitleText: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  biotipoDescriptionBox: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    width: '100%',
  },
  biotipoDescriptionText: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  resultActions: {
    width: '100%',
    gap: 10,
  },
  resultButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  resultButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  resultSubButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultSubButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },

  footerSpacing: {
    height: 100,
  },
});
