import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, IconTile, Screen, SectionTitle } from '../components/ui';
import { MATERIAL_TILES } from './MaterialCalculatorScreen';
import { HomeStackParamList } from '../navigation/types';
import { evaluate } from '../utils/evaluate';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'QuickCalculator'>;

const ROWS = [
  ['AC', '( )', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];
const OPERATORS = ['÷', '×', '−', '+'];

const show = (n: number) => String(Number(n.toPrecision(12)));

export default function QuickCalculatorScreen({ navigation }: Props) {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const press = (key: string) => {
    // Typing after "=" continues from the result for operators, or starts fresh.
    let current = expr;
    if (result !== null) {
      current = OPERATORS.includes(key) || key === '%' ? result : '';
      setResult(null);
    }
    const last = current.slice(-1);

    if (key === 'AC') {
      setExpr('');
      setResult(null);
    } else if (key === '⌫') {
      setExpr(current.slice(0, -1));
    } else if (key === '=') {
      const value = evaluate(current);
      if (value !== null) {
        setResult(show(value));
        setExpr(current);
      } else {
        setExpr(current);
      }
    } else if (key === '( )') {
      const open = (current.match(/\(/g) ?? []).length;
      const close = (current.match(/\)/g) ?? []).length;
      const canClose = open > close && /[0-9)%]/.test(last);
      const needsMul = /[0-9)%]/.test(last) && !canClose;
      setExpr(current + (canClose ? ')' : `${needsMul ? '×' : ''}(`));
    } else if (OPERATORS.includes(key)) {
      if (current === '' && key !== '−') {
        return;
      }
      // Replace a trailing operator instead of stacking them.
      setExpr(OPERATORS.includes(last) ? current.slice(0, -1) + key : current + key);
    } else if (key === '%') {
      if (/[0-9)]/.test(last)) {
        setExpr(current + key);
      }
    } else if (key === '.') {
      const currentNumber = current.split(/[÷×−+()%]/).pop() ?? '';
      if (!currentNumber.includes('.')) {
        setExpr(current + (currentNumber === '' ? '0.' : '.'));
      }
    } else {
      setExpr(current + key);
    }
  };

  const live = result === null && expr !== '' ? evaluate(expr) : null;

  return (
    <Screen title="Calculator" onBack={navigation.goBack}>
      <View style={styles.display}>
        <Text style={styles.expr} numberOfLines={2} adjustsFontSizeToFit>
          {expr || '0'}
        </Text>
        <Text style={styles.result} numberOfLines={1} adjustsFontSizeToFit>
          {result ?? (live !== null && OPERATORS.some(o => expr.includes(o)) ? show(live) : ' ')}
        </Text>
      </View>
      <View style={styles.pad}>
        {ROWS.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map(key => {
              const isOp = OPERATORS.includes(key);
              const isEquals = key === '=';
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={key === '⌫' ? 'Backspace' : key}
                  onPress={() => press(key)}
                  style={({ pressed }) => [
                    styles.key,
                    isOp && styles.keyOp,
                    isEquals && styles.keyEquals,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Text
                    style={[
                      styles.keyText,
                      isOp && styles.keyTextOp,
                      isEquals && styles.keyTextEquals,
                    ]}>
                    {key}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <SectionTitle title="Quick Material Access" />
      <View style={styles.grid}>
        {MATERIAL_TILES.map(t => (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            accessibilityLabel={`${t.title} calculator`}
            onPress={() => navigation.navigate('Calculator', { id: t.key })}
            style={({ pressed }) => [styles.gridItem, pressed && { opacity: 0.7 }]}>
            <Card style={styles.material}>
              <IconTile icon={t.icon} color="#fff" background={t.color} size={42} iconSize={20} />
              <Text style={styles.materialText} numberOfLines={1}>
                {t.title}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  display: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    minHeight: 140,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 6,
  },
  expr: { fontSize: 32, color: colors.text, fontWeight: '600', textAlign: 'right' },
  result: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  pad: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  key: {
    flex: 1,
    height: 66,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyOp: { backgroundColor: colors.primarySoft },
  keyEquals: { backgroundColor: colors.primary },
  keyTextOp: { color: colors.primary },
  keyTextEquals: { color: '#fff' },
  keyText: { fontSize: 24, fontWeight: '600', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  // Three per row: (100% - two 12px gaps) / 3.
  gridItem: { width: '31%', flexGrow: 1 },
  material: { alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 8 },
  materialText: { fontSize: 12, fontWeight: '700', color: colors.text },
});
