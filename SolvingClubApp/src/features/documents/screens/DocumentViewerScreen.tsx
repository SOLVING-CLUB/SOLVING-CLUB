import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Share,
  Linking,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useColors} from '../../../core/theme/colors';
import {Spacing} from '../../../core/constants';
import {Text} from '../../../shared/components';
import {RootStackParamList} from '../../../app/navigation/types';
import {getDocumentById} from '../data/mockDocuments';
import {Document} from '../types';
import PDFViewer from '../components/PDFViewer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DocumentViewer'>;
type RouteProp = RouteProp<RootStackParamList, 'DocumentViewer'>;

/**
 * Document Viewer Screen
 * Displays PDF documents with navigation and sharing options
 */
const DocumentViewerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const colors = useColors();
  const {documentId} = route.params;
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch from API
    const doc = getDocumentById(documentId);
    if (doc) {
      setDocument(doc);
    } else {
      Alert.alert('Error', 'Document not found', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    }
    setLoading(false);
  }, [documentId, navigation]);

  const handleShare = async () => {
    if (!document) return;

    try {
      const result = await Share.share({
        message: `Check out this document: ${document.title}\n${document.fileUrl}`,
        title: document.title,
      });

      if (result.action === Share.sharedAction) {
        // Shared successfully
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share document');
    }
  };

  const handleOpenExternal = async () => {
    if (!document) return;

    try {
      const canOpen = await Linking.canOpenURL(document.fileUrl);
      if (canOpen) {
        await Linking.openURL(document.fileUrl);
      } else {
        Alert.alert('Error', 'Cannot open this file');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open file');
    }
  };

  if (loading || !document) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text variant="h3">←</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Prepare PDF source
  // Handle different URL formats
  let pdfSource: {uri: string; cache?: boolean} | number;
  
  if (document.fileUrl.startsWith('http://') || document.fileUrl.startsWith('https://')) {
    // Remote URL
    pdfSource = {uri: document.fileUrl, cache: true};
  } else if (document.fileUrl.startsWith('file://')) {
    // Local file path
    pdfSource = {uri: document.fileUrl, cache: false};
  } else {
    // Try as local file path without file:// prefix
    pdfSource = {uri: `file://${document.fileUrl}`, cache: false};
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text variant="h3" style={styles.backIcon}>
              ←
            </Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text variant="bodyLarge" style={styles.title} numberOfLines={1}>
              {document.title}
            </Text>
            {document.clientName && (
              <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
                {document.clientName}
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.actionButton, {backgroundColor: colors.primaryLight + '20'}]}>
              <Text style={styles.actionIcon}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenExternal}
              style={[styles.actionButton, {backgroundColor: colors.primaryLight + '20'}]}>
              <Text style={styles.actionIcon}>🔗</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* PDF Viewer */}
      <View style={styles.viewerContainer}>
        <PDFViewer source={pdfSource} />
      </View>

      {/* Document Info Footer (Optional) */}
      {document.description && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}>
          <Text variant="bodySmall" color="textSecondary">
            {document.description}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  backIcon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  viewerContainer: {
    flex: 1,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    maxHeight: 80,
  },
});

export default DocumentViewerScreen;
