import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronDown, ChevronRight, ChevronUp, Eye, Save } from 'lucide-react-native';
import {
  api,
  ApiError,
  EstimateInput,
  EstimateResult,
  WorkTypeField,
} from '../../api/client';
import { useApi } from '../../api/useApi';
import {
  Button,
  Card,
  NumberInput,
  Screen,
  SectionTitle,
  SelectField,
  TextField,
} from '../../components/ui';
import { DISTRICTS } from '../../data/locations';
import {
  buildInputs,
  fieldErrorsFromDetails,
  groupFields,
  initialRaw,
  RawInputs,
  splitFields,
} from '../../estimates/fields';
import { EstimationStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthStore';
import { colors, radius } from '../../theme';
import { formatRupees } from '../../utils/money';
import { ErrorView, FieldInput, InlineError, LoadingView } from './shared';

type Props = NativeStackScreenProps<EstimationStackParamList, 'CreateWork'>;

const LOCATION_OPTIONS = Object.entries(DISTRICTS).flatMap(([district, janpads]) =>
  janpads.map(j => `${j}, ${district}`),
);

const asClientName = (gp: string) =>
  !gp ? null : /gram\s*panchayat/i.test(gp) ? gp : `Gram Panchayat ${gp}`;

const parsePercent = (s: string) => (s.trim() === '' ? undefined : Number(s));

function FieldGroups({
  fields,
  raw,
  errors,
  onChange,
}: {
  fields: WorkTypeField[];
  raw: RawInputs;
  errors: Record<string, string>;
  onChange: (key: string, v: string) => void;
}) {
  return (
    <>
      {groupFields(fields).map((g, i) => (
        <View key={`${g.title}-${i}`}>
          {g.title ? <Text style={styles.groupTitle}>{g.title}</Text> : null}
          {g.fields.map(f => (
            <FieldInput
              key={f.key}
              field={f}
              value={raw[f.key] ?? ''}
              onChange={v => onChange(f.key, v)}
              error={errors[f.key]}
            />
          ))}
        </View>
      ))}
    </>
  );
}

function PreviewCard({ result }: { result: EstimateResult }) {
  return (
    <Card style={styles.preview}>
      <Text style={styles.previewTitle}>Cost preview (not saved)</Text>
      <View style={styles.previewRow}>
        <Text style={styles.previewLabel}>Items</Text>
        <Text style={styles.previewValue}>{result.line_items.length}</Text>
      </View>
      <View style={styles.previewRow}>
        <Text style={styles.previewLabel}>Subtotal</Text>
        <Text style={styles.previewValue}>{formatRupees(result.subtotal, 2)}</Text>
      </View>
      <View style={styles.previewRow}>
        <Text style={styles.previewLabel}>Contingency ({result.contingency_percent}%)</Text>
        <Text style={styles.previewValue}>{formatRupees(result.contingency_amount, 2)}</Text>
      </View>
      <View style={styles.previewRow}>
        <Text style={styles.previewLabel}>GST ({result.gst_percent}%)</Text>
        <Text style={styles.previewValue}>{formatRupees(result.gst_amount, 2)}</Text>
      </View>
      <View style={[styles.previewRow, styles.previewTotal]}>
        <Text style={styles.previewTotalLabel}>Total</Text>
        <Text style={styles.previewTotalValue}>{formatRupees(result.total_amount, 2)}</Text>
      </View>
      <Text style={styles.words}>{result.total_in_words}</Text>
    </Card>
  );
}

export default function CreateWorkScreen({ navigation, route }: Props) {
  const { authed, local } = useAuth();
  const params = route.params ?? {};
  const mode = params.estimateId ? 'edit' : params.projectId ? 'add' : 'new';
  const profileLoc = local.location;

  // Project details (new work only)
  const [constructionOf, setConstructionOf] = useState('');
  const [location, setLocation] = useState(
    profileLoc?.janpad && profileLoc.district ? `${profileLoc.janpad}, ${profileLoc.district}` : '',
  );
  const [village, setVillage] = useState(profileLoc?.village ?? '');
  const [gramPanchayat, setGramPanchayat] = useState(profileLoc?.panchayat ?? '');
  const [description, setDescription] = useState('');

  // Estimate
  const [workTypeKey, setWorkTypeKey] = useState<string | null>(params.workType ?? null);
  const [workName, setWorkName] = useState('');
  const [contingency, setContingency] = useState('');
  const [gst, setGst] = useState('');
  const [raw, setRaw] = useState<RawInputs>({});
  const [showOptional, setShowOptional] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'save' | 'preview' | null>(null);
  const [preview, setPreview] = useState<EstimateResult | null>(null);
  // If the project was created but its estimate failed, retry against the same project.
  const createdProjectId = useRef<number | null>(null);

  const workTypes = useApi(mode === 'edit' ? null : t => api.workTypes(t), [mode]);
  const detail = useApi(workTypeKey ? t => api.workType(t, workTypeKey) : null, [workTypeKey]);
  const existing = useApi(
    mode === 'edit' ? t => api.estimate(t, params.estimateId!) : null,
    [params.estimateId],
  );
  const project = useApi(
    mode === 'add' ? t => api.project(t, params.projectId!) : null,
    [params.projectId],
  );

  // Fill the form from the estimate being edited (once).
  const filledFromExisting = useRef(false);
  useEffect(() => {
    const e = existing.data;
    if (e && !filledFromExisting.current) {
      filledFromExisting.current = true;
      setWorkTypeKey(e.work_type);
      setWorkName(e.name);
      setContingency(String(e.contingency_percent ?? ''));
      setGst(String(e.gst_percent ?? ''));
    }
  }, [existing.data]);

  // Reset measurement inputs when the work type definition changes (not on focus reloads).
  const initializedFor = useRef<string | null>(null);
  const fields = detail.data?.key === workTypeKey ? detail.data.fields : null;
  useEffect(() => {
    if (!fields || initializedFor.current === workTypeKey) {
      return;
    }
    if (mode === 'edit' && !existing.data) {
      return;
    }
    initializedFor.current = workTypeKey;
    setRaw(initialRaw(fields, mode === 'edit' ? existing.data?.inputs : undefined));
    setFieldErrors({});
  }, [fields, workTypeKey, mode, existing.data]);

  const title = detail.data?.title ?? '';
  useEffect(() => {
    // Default the work name to the work type until the user types their own.
    if (title && mode !== 'edit') {
      setWorkName(n => n || title);
      setConstructionOf(n => n || title);
    }
  }, [title, mode]);

  const chooseType = (label: string) => {
    const t = workTypes.data?.find(w => w.title === label);
    if (!t || t.key === workTypeKey) {
      return;
    }
    // Keep a custom name; otherwise follow the work type.
    if (!constructionOf || constructionOf === title) {
      setConstructionOf(t.title);
    }
    if (!workName || workName === title) {
      setWorkName(t.title);
    }
    setPreview(null);
    setWorkTypeKey(t.key);
  };

  const setField = (key: string, v: string) => {
    setRaw(r => ({ ...r, [key]: v }));
    setPreview(null);
    if (fieldErrors[key]) {
      setFieldErrors(errs => {
        const next = { ...errs };
        delete next[key];
        return next;
      });
    }
  };

  /** Validates locally and returns the estimate payload, or null with errors shown. */
  const collect = (): EstimateInput | null => {
    setFormError(null);
    if (!workTypeKey || !fields) {
      setFormError('Select a work type.');
      return null;
    }
    const name = (mode === 'new' ? constructionOf : workName).trim();
    if (!name) {
      setFormError(mode === 'new' ? 'Enter what is being constructed.' : 'Enter a name for this work.');
      return null;
    }
    const { inputs, errors } = buildInputs(fields, raw);
    const percents = { contingency: parsePercent(contingency), gst: parsePercent(gst) };
    if ([percents.contingency, percents.gst].some(p => p !== undefined && !(p >= 0 && p <= 100))) {
      setFormError('Contingency and GST must be between 0 and 100%.');
      return null;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      // Local checks only flag required or out-of-range fields; optional blanks never error.
      if (fields.some(f => !f.required && errors[f.key])) {
        setShowOptional(true);
      }
      setFormError('Please fix the highlighted measurements.');
      return null;
    }
    return {
      work_type: workTypeKey,
      name,
      inputs,
      ...(percents.contingency !== undefined && { contingency_percent: percents.contingency }),
      ...(percents.gst !== undefined && { gst_percent: percents.gst }),
    };
  };

  const showApiError = (e: unknown) => {
    if (e instanceof ApiError) {
      const { errors, other } = fieldErrorsFromDetails(e.details);
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        // Server errors may point at optional fields; make sure they are visible.
        if (fields?.some(f => !f.required && errors[f.key])) {
          setShowOptional(true);
        }
      }
      setFormError(other.length ? other.join('\n') : e.message);
    } else {
      setFormError('Something went wrong. Please try again.');
    }
  };

  const runPreview = async () => {
    Keyboard.dismiss();
    const payload = collect();
    if (!payload) {
      return;
    }
    setBusy('preview');
    try {
      setPreview(await authed(t => api.previewEstimate(t, payload)));
    } catch (e) {
      showApiError(e);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    Keyboard.dismiss();
    const payload = collect();
    if (!payload) {
      return;
    }
    setBusy('save');
    try {
      if (mode === 'edit') {
        // The work type of an existing estimate can't change.
        const changes = { ...payload };
        delete changes.work_type;
        await authed(t => api.updateEstimate(t, params.estimateId!, changes));
        navigation.goBack();
        return;
      }
      let projectId = params.projectId ?? createdProjectId.current;
      if (!projectId) {
        const p = await authed(t =>
          api.createProject(t, {
            name: payload.name!,
            location: [village, location].filter(Boolean).join(', ') || null,
            client_name: asClientName(gramPanchayat),
            description: description.trim() || null,
          }),
        );
        projectId = createdProjectId.current = p.id;
      }
      const est = await authed(t => api.createEstimate(t, projectId!, payload));
      navigation.replace('EstimateDetail', { id: est.id });
    } catch (e) {
      showApiError(e);
      setBusy(null);
    }
  };

  const screenTitle = mode === 'edit' ? 'Edit Work' : mode === 'add' ? 'Add Work' : 'Create New Work';
  const blocking =
    (mode === 'edit' && (existing.error || (!existing.data && existing.loading))) ||
    (mode === 'add' && project.error);
  if (blocking) {
    const failed = existing.error || project.error;
    return (
      <Screen title={screenTitle} onBack={navigation.goBack}>
        {failed ? (
          <ErrorView message={failed} onRetry={mode === 'edit' ? existing.reload : project.reload} />
        ) : (
          <LoadingView />
        )}
      </Screen>
    );
  }

  const { required, optional } = splitFields(fields ?? []);

  return (
    <Screen title={screenTitle} onBack={navigation.goBack}>
      <Card>
        {mode === 'add' && (
          <Text style={styles.projectName}>
            Project: <Text style={styles.projectNameBold}>{project.data?.name ?? '…'}</Text>
          </Text>
        )}
        {mode === 'edit' ? (
          <Text style={styles.projectName}>
            Work type: <Text style={styles.projectNameBold}>{existing.data?.work_type_title}</Text>
          </Text>
        ) : (
          <SelectField
            label="Work Type"
            required
            placeholder={workTypes.loading && !workTypes.data ? 'Loading…' : 'Select Work Type'}
            options={workTypes.data?.map(w => w.title) ?? []}
            value={title || workTypes.data?.find(w => w.key === workTypeKey)?.title || ''}
            onChange={chooseType}
            hint={workTypes.error ?? detail.data?.description}
          />
        )}
        {mode === 'new' ? (
          <>
            <TextField
              label="Construction of"
              required
              value={constructionOf}
              onChangeText={setConstructionOf}
              placeholder="e.g. CC road from school to panchayat bhawan"
            />
            <SelectField
              label="Location"
              placeholder="Select Location"
              options={LOCATION_OPTIONS}
              value={location}
              onChange={setLocation}
              allowAdd
            />
            <SelectField
              label="Village"
              placeholder="Select Village"
              options={profileLoc?.village ? [profileLoc.village] : []}
              value={village}
              onChange={setVillage}
              allowAdd
            />
            <SelectField
              label="Gram Panchayat"
              placeholder="Select Gram Panchayat"
              options={profileLoc?.panchayat ? [profileLoc.panchayat] : []}
              value={gramPanchayat}
              onChange={setGramPanchayat}
              allowAdd
            />
            <TextField
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Optional notes about this project"
              multiline
            />
          </>
        ) : (
          <TextField
            label="Work Name"
            required
            value={workName}
            onChangeText={setWorkName}
            placeholder="e.g. Community toilet near school"
          />
        )}
        <Pressable
          onPress={() => navigation.navigate('Rates')}
          accessibilityRole="button"
          style={styles.rateRow}>
          <View style={styles.flex}>
            <Text style={styles.rateLabel}>Rate/CSR</Text>
            <Text style={styles.rateValue}>SOR rates · tap to view or set your own</Text>
          </View>
          <ChevronRight size={18} color={colors.textFaint} />
        </Pressable>
        <View style={styles.row}>
          <View style={styles.flex}>
            <NumberInput
              label="Contingency (%)"
              value={contingency}
              onChangeText={setContingency}
              placeholder="Default"
            />
          </View>
          <View style={styles.flex}>
            <NumberInput label="GST (%)" value={gst} onChangeText={setGst} placeholder="Default" />
          </View>
        </View>
      </Card>

      {workTypeKey ? (
        <>
          <SectionTitle title="Estimated Measurement" />
          {detail.error ? (
            <ErrorView message={detail.error} onRetry={detail.reload} />
          ) : !fields ? (
            <LoadingView label="Loading fields…" />
          ) : (
            <Card>
              <FieldGroups fields={required} raw={raw} errors={fieldErrors} onChange={setField} />
              {optional.length > 0 && (
                <>
                  <Pressable
                    onPress={() => setShowOptional(s => !s)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: showOptional }}
                    style={styles.moreToggle}>
                    <Text style={styles.moreText}>
                      {showOptional ? 'Hide' : 'More'} options ({optional.length})
                    </Text>
                    {showOptional ? (
                      <ChevronUp size={18} color={colors.primary} />
                    ) : (
                      <ChevronDown size={18} color={colors.primary} />
                    )}
                  </Pressable>
                  {!showOptional && (
                    <Text style={styles.moreHint}>
                      Optional values use the standard defaults when left blank.
                    </Text>
                  )}
                  {showOptional && (
                    <FieldGroups fields={optional} raw={raw} errors={fieldErrors} onChange={setField} />
                  )}
                </>
              )}
            </Card>
          )}
        </>
      ) : (
        <Text style={styles.pickType}>Select a work type to enter its measurements.</Text>
      )}

      <InlineError message={formError} />
      {preview && <PreviewCard result={preview} />}

      <View style={styles.row}>
        <View style={styles.flex}>
          <Button
            label="Preview Cost"
            icon={Eye}
            variant="secondary"
            loading={busy === 'preview'}
            disabled={!fields || busy === 'save'}
            onPress={runPreview}
          />
        </View>
        <View style={styles.flex}>
          <Button
            label={mode === 'edit' ? 'Save' : 'Submit'}
            icon={mode === 'edit' ? Save : undefined}
            variant="gradient"
            loading={busy === 'save'}
            disabled={!fields || busy === 'preview'}
            onPress={save}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  projectName: { fontSize: 13, color: colors.textMuted, marginBottom: 14 },
  projectNameBold: { fontWeight: '800', color: colors.text },
  groupTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  rateLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  rateValue: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  moreText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  moreHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  pickType: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  preview: { backgroundColor: colors.primarySoft },
  previewTitle: { fontSize: 14, fontWeight: '800', color: colors.primaryDark, marginBottom: 8 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  previewLabel: { fontSize: 13, color: colors.textMuted },
  previewValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  previewTotal: { borderTopWidth: 1, borderTopColor: '#FED7AA', marginTop: 6, paddingTop: 8 },
  previewTotalLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  previewTotalValue: { fontSize: 17, fontWeight: '800', color: colors.primaryDark },
  words: { fontSize: 12, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },
});
