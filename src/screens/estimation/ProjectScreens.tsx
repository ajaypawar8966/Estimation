import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ChevronRight,
  ClipboardList,
  FolderOpen,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react-native';
import { api, ApiError } from '../../api/client';
import { useApi } from '../../api/useApi';
import { Button, Card, EmptyState, formatDate, IconTile, Screen, TextField } from '../../components/ui';
import { EstimationStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthStore';
import { colors } from '../../theme';
import { formatRupees } from '../../utils/money';
import { ErrorView, InlineError, LoadingView } from './shared';

type Props<K extends keyof EstimationStackParamList> = NativeStackScreenProps<
  EstimationStackParamList,
  K
>;

/* ---------- List ---------- */

export function ProjectsScreen({ navigation }: Props<'Projects'>) {
  const { data, error, loading, reload } = useApi(t => api.projects(t), []);
  const newButton = (
    <Button
      label="Create New Work"
      icon={Plus}
      variant="gradient"
      onPress={() => navigation.navigate('CreateWork')}
    />
  );

  return (
    <Screen title="Projects" onBack={navigation.goBack}>
      {error && !data ? (
        <ErrorView message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingView label={loading ? 'Loading projects…' : ''} />
      ) : data.length === 0 ? (
        <>
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            body="Create a new work to start a project. Its estimates will be listed here."
          />
          {newButton}
        </>
      ) : (
        <>
          {data.map(p => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              onPress={() => navigation.navigate('ProjectDetail', { id: p.id })}>
              <Card style={styles.item}>
                <IconTile icon={FolderOpen} color="#9333EA" background="#FAF5FF" />
                <View style={styles.flex}>
                  <Text style={styles.name} numberOfLines={2}>
                    {p.name}
                  </Text>
                  {p.location ? (
                    <Text style={styles.meta} numberOfLines={1}>
                      {p.location}
                    </Text>
                  ) : null}
                  <Text style={styles.meta}>
                    {p.estimates_count} work{p.estimates_count === 1 ? '' : 's'} · {formatDate(Date.parse(p.created_at))}
                  </Text>
                  <Text style={styles.amount}>{formatRupees(p.total_amount)}</Text>
                </View>
                <ChevronRight size={18} color={colors.textFaint} />
              </Card>
            </Pressable>
          ))}
          {newButton}
        </>
      )}
    </Screen>
  );
}

/* ---------- Detail ---------- */

export function ProjectDetailScreen({ navigation, route }: Props<'ProjectDetail'>) {
  const { id } = route.params;
  const { authed } = useAuth();
  const { data: project, error, reload } = useApi(t => api.project(t, id), [id]);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () =>
    Alert.alert(
      'Delete project?',
      `"${project?.name}" and all of its estimates will be deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await authed(t => api.deleteProject(t, id));
              navigation.goBack();
            } catch (e) {
              setDeleting(false);
              Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.');
            }
          },
        },
      ],
    );

  if (!project) {
    return (
      <Screen title="Project" onBack={navigation.goBack}>
        {error ? <ErrorView message={error} onRetry={reload} /> : <LoadingView />}
      </Screen>
    );
  }

  return (
    <Screen
      title={project.name}
      onBack={navigation.goBack}
      right={
        <Pressable
          onPress={() => navigation.navigate('ProjectEdit', { id })}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit project"
          style={styles.headerBtn}>
          <Pencil size={18} color={colors.primary} />
        </Pressable>
      }>
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Project Total</Text>
        <Text style={styles.totalValue}>{formatRupees(project.total_amount, 2)}</Text>
        <Text style={styles.totalMeta}>
          {project.estimates_count} work{project.estimates_count === 1 ? '' : 's'} · created{' '}
          {formatDate(Date.parse(project.created_at))}
        </Text>
      </Card>

      {(project.location || project.client_name || project.description) && (
        <Card style={styles.infoCard}>
          {project.location ? (
            <View style={styles.infoRow}>
              <MapPin size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>{project.location}</Text>
            </View>
          ) : null}
          {project.client_name ? (
            <View style={styles.infoRow}>
              <Users size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>{project.client_name}</Text>
            </View>
          ) : null}
          {project.description ? <Text style={styles.description}>{project.description}</Text> : null}
        </Card>
      )}

      <Text style={styles.section}>Works</Text>
      {project.estimates.length === 0 ? (
        <Text style={styles.emptyWorks}>No works in this project yet.</Text>
      ) : (
        project.estimates.map(e => (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            onPress={() => navigation.navigate('EstimateDetail', { id: e.id })}>
            <Card style={styles.item}>
              <IconTile icon={ClipboardList} color={colors.primary} background="#FFF3E8" />
              <View style={styles.flex}>
                <Text style={styles.name} numberOfLines={2}>
                  {e.name}
                </Text>
                <Text style={styles.meta}>
                  {e.work_type_title} · {formatDate(Date.parse(e.calculated_at))}
                </Text>
                <Text style={styles.amount}>{formatRupees(e.total_amount)}</Text>
              </View>
              <ChevronRight size={18} color={colors.textFaint} />
            </Card>
          </Pressable>
        ))
      )}

      <Button
        label="Add Work"
        icon={Plus}
        variant="gradient"
        onPress={() => navigation.navigate('CreateWork', { projectId: id })}
      />
      <Button
        label="Delete Project"
        icon={Trash2}
        variant="danger"
        loading={deleting}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

/* ---------- Edit ---------- */

export function ProjectEditScreen({ navigation, route }: Props<'ProjectEdit'>) {
  const { id } = route.params;
  const { authed } = useAuth();
  const { data: project, error, reload } = useApi(t => api.project(t, id), [id]);
  const [form, setForm] = useState({ name: '', location: '', client_name: '', description: '' });
  const [filled, setFilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (project && !filled) {
      setFilled(true);
      setForm({
        name: project.name,
        location: project.location ?? '',
        client_name: project.client_name ?? '',
        description: project.description ?? '',
      });
    }
  }, [project, filled]);

  const set = (key: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  const save = async () => {
    Keyboard.dismiss();
    if (!form.name.trim()) {
      setSaveError('Enter a project name.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await authed(t =>
        api.updateProject(t, id, {
          name: form.name.trim(),
          location: form.location.trim() || null,
          client_name: form.client_name.trim() || null,
          description: form.description.trim() || null,
        }),
      );
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      setSaveError(e instanceof ApiError ? e.message : 'Could not save. Please try again.');
    }
  };

  if (!project || !filled) {
    return (
      <Screen title="Edit Project" onBack={navigation.goBack}>
        {error ? <ErrorView message={error} onRetry={reload} /> : <LoadingView />}
      </Screen>
    );
  }

  return (
    <Screen
      title="Edit Project"
      onBack={navigation.goBack}
      footer={<Button label="Save Changes" variant="gradient" loading={saving} onPress={save} />}>
      <Card>
        <TextField label="Project Name" required value={form.name} onChangeText={set('name')} />
        <TextField
          label="Location"
          value={form.location}
          onChangeText={set('location')}
          placeholder="e.g. Rampur, Dist. Sehore"
        />
        <TextField
          label="Client / Gram Panchayat"
          value={form.client_name}
          onChangeText={set('client_name')}
          placeholder="e.g. Gram Panchayat Rampur"
        />
        <TextField
          label="Description"
          value={form.description}
          onChangeText={set('description')}
          multiline
        />
      </Card>
      <InlineError message={saveError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 14, color: colors.primary, fontWeight: '800', marginTop: 6 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: { backgroundColor: colors.primarySoft, alignItems: 'center', paddingVertical: 20 },
  totalLabel: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  totalValue: { fontSize: 28, fontWeight: '800', color: colors.primaryDark, marginTop: 4 },
  totalMeta: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  infoCard: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { flex: 1, fontSize: 14, color: colors.text },
  description: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  section: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 4 },
  emptyWorks: { fontSize: 13, color: colors.textMuted },
});
