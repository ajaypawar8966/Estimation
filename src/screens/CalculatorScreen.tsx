import React, { useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Save } from 'lucide-react-native';
import {
  Button,
  Card,
  ChipSelect,
  NumberInput,
  PromptModal,
  Screen,
} from '../components/ui';
import { ResultCard } from '../components/ResultCard';
import {
  CALCULATORS,
  calculate,
  defaultValues,
  describeInputs,
  visibleFields,
} from '../calculators';
import { HomeStackParamList } from '../navigation/types';
import { useStore } from '../store/AppStore';
import { colors } from '../theme';
import { ResultLine, Values } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Calculator'>;

export default function CalculatorScreen({ navigation, route }: Props) {
  const def = CALCULATORS[route.params.id];
  const { addEstimate } = useStore();
  const [values, setValues] = useState<Values>(() => defaultValues(def));
  const [lines, setLines] = useState<ResultLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: string, value: string) => {
    setValues(v => ({ ...v, [key]: value }));
    // Inputs changed, so the shown result is stale.
    setLines(null);
    setError(null);
    setSaved(false);
  };

  const onCalculate = () => {
    Keyboard.dismiss();
    const outcome = calculate(def, values);
    if ('error' in outcome) {
      setLines(null);
      setError(outcome.error);
    } else {
      setError(null);
      setLines(outcome.lines);
      setSaved(false);
    }
  };

  const onReset = () => {
    setValues(defaultValues(def));
    setLines(null);
    setError(null);
    setSaved(false);
  };

  const onSave = (name: string) => {
    if (!lines) {
      return;
    }
    addEstimate({
      calcId: def.id,
      name,
      inputs: describeInputs(def, values),
      results: lines,
    });
    setNaming(false);
    setSaved(true);
    Alert.alert('Saved', `"${name}" was added to Estimation.`);
  };

  return (
    <Screen title={`${def.title} Calculator`} onBack={navigation.goBack}>
      <Text style={styles.description}>{def.description}</Text>

      <Card>
        {visibleFields(def, values).map(f =>
          f.kind === 'number' ? (
            <NumberInput
              key={f.key}
              label={f.label}
              unit={f.unit}
              optional={f.optional}
              value={values[f.key]}
              onChangeText={t => set(f.key, t)}
            />
          ) : (
            <ChipSelect
              key={f.key}
              label={f.label}
              options={f.options}
              value={values[f.key]}
              onChange={v => set(f.key, v)}
            />
          ),
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          <View style={styles.flex}>
            <Button label="Reset" variant="secondary" onPress={onReset} />
          </View>
          <View style={styles.flex2}>
            <Button label="Calculate" onPress={onCalculate} />
          </View>
        </View>
      </Card>

      {lines && (
        <>
          <ResultCard lines={lines} />
          <Button
            label={saved ? 'Saved to Estimation' : 'Save to Estimation'}
            icon={Save}
            variant={saved ? 'secondary' : 'primary'}
            disabled={saved}
            onPress={() => setNaming(true)}
          />
        </>
      )}

      <PromptModal
        visible={naming}
        title="Save estimate"
        initial={`${def.title} estimate`}
        onConfirm={onSave}
        onCancel={() => setNaming(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  description: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  flex2: { flex: 2 },
});
