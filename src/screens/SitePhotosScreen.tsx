import React, { ReactNode, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Asset,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import {
  Camera,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  FolderOpen,
  Image as ImageIcon,
  LucideIcon,
  MapPin,
  Plus,
  Save,
  Trash2,
} from 'lucide-react-native';
import {
  Card,
  formatDate,
  IconTile,
  Screen,
  SelectField,
  TextField,
} from '../components/ui';
import { HomeStackParamList } from '../navigation/types';
import { useStore } from '../store/AppStore';
import { colors, radius } from '../theme';
import { SitePhoto } from '../types';

const blue = '#2563EB';
const blueSoft = '#EAF1FF';

const ALL_PROJECTS = 'All Projects';
const WORK_TYPES = [
  'CC Road',
  'Drain',
  'Building',
  'Culvert',
  'Boundary Wall',
  'Toilet',
];

const PICKER_OPTIONS = { mediaType: 'photo', quality: 0.8 } as const;

/** Opens the camera or gallery and reports the chosen image, if any. */
function pickPhoto(
  source: 'camera' | 'gallery',
  onPicked: (uri: string) => void,
) {
  const handle = (res: ImagePickerResponse) => {
    if (res.errorCode) {
      Alert.alert('Could not get photo', res.errorMessage ?? res.errorCode);
      return;
    }
    const asset: Asset | undefined = res.assets?.[0];
    if (asset?.uri) {
      onPicked(asset.uri);
    }
  };
  (source === 'camera' ? launchCamera : launchImageLibrary)(
    PICKER_OPTIONS,
    handle,
  );
}

/* ---------- Site photographs ---------- */

type DateRange = 'all' | 'today' | 'week' | 'month';

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

/** Earliest timestamp included by a date filter. */
function rangeStart(range: DateRange): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === 'week') {
    d.setDate(d.getDate() - 6);
  } else if (range === 'month') {
    d.setDate(1);
  } else if (range === 'all') {
    return 0;
  }
  return d.getTime();
}

function InfoLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View style={styles.infoLine}>
      <Icon size={15} color={colors.textMuted} />
      <Text style={styles.infoText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function ProjectCard({ name, photos }: { name: string; photos: SitePhoto[] }) {
  // Photos are stored newest first, so the first one carries the latest details.
  const workType = photos.find(p => p.workType)?.workType;
  const sites = [...new Set(photos.map(p => p.site).filter(Boolean))];
  return (
    <Card style={styles.projectCard}>
      <Text style={styles.projectName}>{name}</Text>
      {workType ? <Text style={styles.tag}>{workType}</Text> : null}
      {sites.slice(0, 2).map(s => (
        <InfoLine key={s} icon={MapPin} text={s} />
      ))}
      <InfoLine
        icon={ImageIcon}
        text={`${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`}
      />
    </Card>
  );
}

export default function SitePhotosScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'SitePhotos'>) {
  const { photos, deletePhoto } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [project, setProject] = useState(ALL_PROJECTS);
  const [range, setRange] = useState<DateRange>('all');

  const projects = useMemo(
    () => [
      ALL_PROJECTS,
      ...new Set(photos.map(p => p.project).filter((p): p is string => !!p)),
    ],
    [photos],
  );
  const projectPhotos =
    project === ALL_PROJECTS
      ? photos
      : photos.filter(p => p.project === project);
  const start = rangeStart(range);
  const shown = projectPhotos.filter(p => p.createdAt >= start);

  const add = (uri?: string) =>
    navigation.navigate('SitePhotoAdd', uri ? { uri } : undefined);

  const confirmDelete = (id: string) =>
    Alert.alert('Delete photo?', 'This removes it from Site Photographs.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePhoto(id) },
    ]);

  return (
    <Screen
      title="Site Photographs"
      centered
      onBack={navigation.goBack}
      right={
        <Pressable
          onPress={() => add()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Add site photo"
          style={styles.headerIcon}
        >
          <Plus size={24} color={blue} />
        </Pressable>
      }
    >
      {project !== ALL_PROJECTS && (
        <ProjectCard name={project} photos={projectPhotos} />
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={() => pickPhoto('camera', add)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            styles.actionPrimary,
            pressed && styles.pressed,
          ]}
        >
          <Camera size={22} color="#fff" />
          <Text style={[styles.actionText, styles.actionTextPrimary]}>
            Capture Photo
          </Text>
        </Pressable>
        <Pressable
          onPress={() => pickPhoto('gallery', add)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            styles.actionOutline,
            pressed && styles.pressed,
          ]}
        >
          <ImageIcon size={22} color={blue} />
          <Text style={styles.actionText}>Upload Gallery</Text>
        </Pressable>
      </View>

      <Card style={styles.filterCard}>
        <Pressable
          onPress={() => setShowFilters(v => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showFilters }}
          style={styles.filterHead}
        >
          <Filter size={18} color={colors.text} />
          <Text style={styles.filterTitle}>Filters</Text>
          {showFilters ? (
            <ChevronDown size={18} color={colors.textMuted} />
          ) : (
            <ChevronRight size={18} color={colors.textMuted} />
          )}
        </Pressable>
        {showFilters && (
          <View style={styles.filterBody}>
            <SelectField
              label="Filter by Project"
              placeholder={ALL_PROJECTS}
              options={projects}
              value={project}
              onChange={setProject}
            />
            <Text style={styles.filterLabel}>Filter by Date</Text>
            <View style={styles.rangeRow}>
              {DATE_RANGES.map(r => {
                const active = r.value === range;
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => setRange(r.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.rangeChip, active && styles.rangeChipActive]}
                  >
                    <Text
                      style={[
                        styles.rangeText,
                        active && styles.rangeTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </Card>

      {shown.length === 0 ? (
        <Card style={styles.empty}>
          <IconTile
            icon={Camera}
            color={colors.textFaint}
            background={colors.chip}
            size={56}
            iconSize={26}
          />
          <Text style={styles.emptyTitle}>
            {photos.length ? 'No Matching Photos' : 'No Photos Yet'}
          </Text>
          <Text style={styles.emptyBody}>
            {photos.length
              ? 'Try a different project or date filter.'
              : 'Capture or upload photos to document your site progress'}
          </Text>
        </Card>
      ) : (
        shown.map(p => (
          <Card key={p.id} style={styles.photoCard}>
            <Image
              source={{ uri: p.uri }}
              style={styles.photo}
              resizeMode="cover"
            />
            <View style={styles.photoRow}>
              <View style={styles.flex}>
                <Text style={styles.caption}>{p.caption}</Text>
                {p.site ? <InfoLine icon={MapPin} text={p.site} /> : null}
                {p.project ? (
                  <InfoLine icon={FolderOpen} text={p.project} />
                ) : null}
                <Text style={styles.meta}>
                  {[p.workType, formatDate(p.createdAt)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Pressable
                onPress={() => confirmDelete(p.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Delete photo"
              >
                <Trash2 size={18} color={colors.textFaint} />
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

/* ---------- Add site photo ---------- */

function FormCard({
  icon: Icon,
  label,
  required,
  children,
}: {
  icon?: LucideIcon;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Card style={styles.formCard}>
      <View style={styles.formLabelRow}>
        {Icon && <Icon size={16} color={blue} />}
        <Text style={styles.formLabel}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      </View>
      {children}
    </Card>
  );
}

export function SitePhotoAddScreen({
  navigation,
  route,
}: NativeStackScreenProps<HomeStackParamList, 'SitePhotoAdd'>) {
  const { photos, addPhoto } = useStore();
  const [uri, setUri] = useState(route.params?.uri);
  const [caption, setCaption] = useState('');
  const [site, setSite] = useState('');
  const [project, setProject] = useState('');
  const [workType, setWorkType] = useState('');

  const projects = useMemo(
    () => [
      ...new Set(photos.map(p => p.project).filter((p): p is string => !!p)),
    ],
    [photos],
  );

  const choosePhoto = () =>
    Alert.alert('Add photo', undefined, [
      { text: 'Take photo', onPress: () => pickPhoto('camera', setUri) },
      {
        text: 'Choose from gallery',
        onPress: () => pickPhoto('gallery', setUri),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const missing = [
    !uri && 'a photo',
    !caption.trim() && 'a description',
    !site.trim() && 'the location',
  ]
    .filter(Boolean)
    .join(', ');

  const save = () => {
    if (!uri || missing) {
      Alert.alert('Missing details', `Please add ${missing}.`);
      return;
    }
    addPhoto({
      uri,
      caption: caption.trim(),
      site: site.trim(),
      project: project || undefined,
      workType: workType || undefined,
    });
    navigation.goBack();
  };

  return (
    <Screen
      title="Add Site Photo"
      onBack={navigation.goBack}
      footer={
        <Pressable
          onPress={save}
          accessibilityRole="button"
          style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
        >
          <Save size={18} color="#fff" />
          <Text style={styles.saveText}>Save Photo</Text>
        </Pressable>
      }
    >
      <FormCard label="Photo Preview">
        <Pressable
          onPress={choosePhoto}
          accessibilityRole="button"
          accessibilityLabel={uri ? 'Change photo' : 'Upload photo'}
          style={[styles.preview, !uri && styles.previewEmpty]}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <>
              <View style={styles.previewIcon}>
                <Camera size={26} color="#fff" />
              </View>
              <Text style={styles.previewTitle}>Upload Photo</Text>
              <Text style={styles.previewSub}>
                Tap to take or select a photo
              </Text>
            </>
          )}
        </Pressable>
      </FormCard>

      <FormCard icon={FileText} label="Description" required>
        <TextField
          value={caption}
          onChangeText={setCaption}
          multiline
          placeholder="e.g., Road construction in progress, width 4.5m"
        />
      </FormCard>

      <FormCard icon={MapPin} label="Location" required>
        <TextField
          value={site}
          onChangeText={setSite}
          placeholder="e.g. Rampur, Site Area-A"
          hint="Enter the village or site area"
        />
      </FormCard>

      <FormCard icon={FolderOpen} label="Project">
        <SelectField
          label="Project name"
          placeholder="Select or add a project"
          options={projects}
          value={project}
          onChange={setProject}
          allowAdd
        />
        <SelectField
          label="Work type"
          placeholder="Select work type"
          options={WORK_TYPES}
          value={workType}
          onChange={setWorkType}
          allowAdd
        />
      </FormCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  headerIcon: { width: 36, alignItems: 'center' },
  projectCard: { gap: 6 },
  projectName: { fontSize: 16, fontWeight: '800', color: colors.text },
  tag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: blue,
    backgroundColor: blueSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 2,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: 12 },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: radius.md,
  },
  actionPrimary: { backgroundColor: blue },
  actionOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { fontSize: 13, fontWeight: '700', color: blue },
  actionTextPrimary: { color: '#fff' },
  filterCard: { paddingVertical: 14 },
  filterHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  filterBody: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  rangeRow: { flexDirection: 'row', gap: 8 },
  rangeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
  },
  rangeChipActive: { backgroundColor: blue, borderColor: blue },
  rangeText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  rangeTextActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 6,
  },
  emptyBody: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  photoCard: { padding: 10, gap: 12 },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.chip,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  caption: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  formCard: { paddingBottom: 2 },
  formLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  formLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  required: { color: colors.danger },
  preview: {
    height: 170,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  previewEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: blueSoft,
    gap: 6,
  },
  previewImage: { width: '100%', height: '100%' },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  previewTitle: { fontSize: 14, fontWeight: '800', color: blue },
  previewSub: { fontSize: 11, color: blue },
  saveBtn: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
