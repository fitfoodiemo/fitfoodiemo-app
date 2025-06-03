import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, FlatList,
  StyleSheet, TouchableOpacity, Alert, ScrollView
} from 'react-native';

export default function App() {
  const [users, setUsers] = useState({});
  const [username, setUsername] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [programName, setProgramName] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);

  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [weight, setWeight] = useState('');
  const [editingExerciseId, setEditingExerciseId] = useState(null);

  const [progress, setProgress] = useState({}); // { exerciseId: [{ week, sets, weight }] }

  const getCurrentWeek = () => {
    const now = new Date();
    const firstJan = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - firstJan) / 86400000;
    return Math.ceil((pastDaysOfYear + firstJan.getDay() + 1) / 7);
  };

  const login = () => {
    if (!username.trim()) return;
    if (!users[username]) {
      setUsers({ ...users, [username]: [] });
    }
    setLoggedInUser(username);
    setUsername('');
  };

  const logout = () => {
    setLoggedInUser(null);
    setSelectedProgram(null);
  };

  const addProgram = () => {
    if (!programName.trim()) return Alert.alert('Naam verplicht');
    const newProgram = {
      id: Date.now().toString(),
      name: programName,
      exercises: [],
    };
    const userPrograms = users[loggedInUser] || [];
    setUsers({ ...users, [loggedInUser]: [...userPrograms, newProgram] });
    setProgramName('');
  };

  const selectProgram = (program) => {
    setSelectedProgram(program);
    setEditingExerciseId(null);
    setExerciseName('');
    setSets('');
    setWeight('');
  };

  const addOrUpdateExercise = () => {
    if (!exerciseName || !sets || !weight) return;

    const updatedPrograms = users[loggedInUser].map(program => {
      if (program.id === selectedProgram.id) {
        let updatedExercises;

        if (editingExerciseId) {
          updatedExercises = program.exercises.map(ex =>
            ex.id === editingExerciseId
              ? { ...ex, name: exerciseName, sets: parseInt(sets), weight: parseFloat(weight) }
              : ex
          );
        } else {
          updatedExercises = [
            ...program.exercises,
            {
              id: Date.now().toString(),
              name: exerciseName,
              sets: parseInt(sets),
              weight: parseFloat(weight),
            },
          ];
        }

        return { ...program, exercises: updatedExercises };
      }
      return program;
    });

    setUsers({ ...users, [loggedInUser]: updatedPrograms });
    setExerciseName('');
    setSets('');
    setWeight('');
    setEditingExerciseId(null);
  };

  const editExercise = (exercise) => {
    setExerciseName(exercise.name);
    setSets(String(exercise.sets));
    setWeight(String(exercise.weight));
    setEditingExerciseId(exercise.id);
  };

  const deleteExercise = (id) => {
    const updatedPrograms = users[loggedInUser].map(program => {
      if (program.id === selectedProgram.id) {
        return {
          ...program,
          exercises: program.exercises.filter(ex => ex.id !== id),
        };
      }
      return program;
    });

    setUsers({ ...users, [loggedInUser]: updatedPrograms });
    setExerciseName('');
    setSets('');
    setWeight('');
    setEditingExerciseId(null);
  };

  const logProgress = (exerciseId) => {
    if (!sets || !weight) return Alert.alert('Voer sets en gewicht in');

    const week = getCurrentWeek();
    const entry = { week, sets: parseInt(sets), weight: parseFloat(weight) };

    setProgress(prev => {
      const old = prev[exerciseId] || [];
      return { ...prev, [exerciseId]: [...old, entry] };
    });

    Alert.alert('Progressie opgeslagen voor week ' + week);
  };

  if (!loggedInUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login Gebruiker</Text>
        <TextInput
          placeholder="Gebruikersnaam"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />
        <Button title="Login" onPress={login} />
      </View>
    );
  }

  const userPrograms = users[loggedInUser];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welkom, {loggedInUser}</Text>
      <Button title="Uitloggen" onPress={logout} />

      <Text style={styles.subtitle}>Nieuw Programma</Text>
      <TextInput
        placeholder="Programma naam"
        value={programName}
        onChangeText={setProgramName}
        style={styles.input}
      />
      <Button title="Toevoegen" onPress={addProgram} />

      <Text style={styles.subtitle}>Programma's</Text>
      {userPrograms.map(program => (
        <TouchableOpacity key={program.id} onPress={() => selectProgram(program)}>
          <Text style={[
            styles.programItem,
            selectedProgram?.id === program.id && styles.selectedProgram
          ]}>
            {program.name}
          </Text>
        </TouchableOpacity>
      ))}

      {selectedProgram && (
        <>
          <Text style={styles.subtitle}>Oefening toevoegen of bewerken</Text>
          <TextInput
            placeholder="Oefening"
            value={exerciseName}
            onChangeText={setExerciseName}
            style={styles.input}
          />
          <TextInput
            placeholder="Sets"
            value={sets}
            onChangeText={setSets}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            placeholder="Gewicht (kg)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            style={styles.input}
          />
          <Button
            title={editingExerciseId ? 'Oefening bijwerken' : 'Oefening toevoegen'}
            onPress={addOrUpdateExercise}
          />

          <Text style={styles.subtitle}>Oefeningen:</Text>
          {selectedProgram.exercises.map(ex => (
            <View key={ex.id} style={styles.exerciseRow}>
              <Text style={styles.exerciseItem}>
                {ex.name} – {ex.sets} sets – {ex.weight} kg
              </Text>
              <View style={styles.actions}>
                <Button title="✏️" onPress={() => editExercise(ex)} />
                <Button title="🗑️" onPress={() => deleteExercise(ex.id)} />
                <Button title="➕ Log" onPress={() => logProgress(ex.id)} />
              </View>
              <Text style={{ fontSize: 12, marginLeft: 10 }}>Progressie:</Text>
              {(progress[ex.id] || []).map((p, idx) => (
                <Text key={idx} style={{ fontSize: 12, marginLeft: 10 }}>
                  Week {p.week}: {p.sets} sets - {p.weight} kg
                </Text>
              ))}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f0f0f0', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#aaa', borderRadius: 8,
    padding: 10, marginVertical: 6, backgroundColor: '#fff',
  },
  programItem: {
    padding: 10, borderBottomWidth: 1,
    borderColor: '#ccc', fontSize: 16,
  },
  selectedProgram: { backgroundColor: '#d0f0d0' },
  exerciseRow: { marginTop: 10 },
  exerciseItem: { fontSize: 14 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 5,
  }
});