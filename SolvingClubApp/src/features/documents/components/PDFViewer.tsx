import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import Pdf from 'react-native-pdf';
import {useColors} from '../../../core/theme/colors';
import {Spacing} from '../../../core/constants';
import {Text} from '../../../shared/components';

interface PDFViewerProps {
  source: {uri: string} | number;
  onLoadComplete?: (numberOfPages: number) => void;
  onError?: (error: Error) => void;
  style?: any;
}

/**
 * PDF Viewer Component
 * Displays PDF documents with loading and error states
 */
const PDFViewer: React.FC<PDFViewerProps> = ({
  source,
  onLoadComplete,
  onError,
  style,
}) => {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const handleLoadComplete = (numberOfPages: number) => {
    setLoading(false);
    setPageCount(numberOfPages);
    onLoadComplete?.(numberOfPages);
  };

  const handleError = (error: Error) => {
    setLoading(false);
    setError(error.message || 'Failed to load PDF');
    onError?.(error);
  };

  const handleOpenExternal = async () => {
    const uri = typeof source === 'object' && 'uri' in source ? source.uri : '';
    if (uri) {
      try {
        const canOpen = await Linking.canOpenURL(uri);
        if (canOpen) {
          await Linking.openURL(uri);
        } else {
          Alert.alert('Error', 'Cannot open this file');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to open file');
      }
    }
  };

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text variant="h3" color="error" center style={styles.errorText}>
          ⚠️
        </Text>
        <Text variant="body" color="error" center style={styles.errorMessage}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, {backgroundColor: colors.primary}]}
          onPress={handleOpenExternal}>
          <Text variant="body" color="white" center>
            Try Opening Externally
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color="textSecondary" center style={styles.loadingText}>
            Loading PDF...
          </Text>
        </View>
      )}

      <Pdf
        source={source}
        onLoadComplete={handleLoadComplete}
        onPageChanged={(page, numberOfPages) => {
          setCurrentPage(page);
        }}
        onError={handleError}
        style={styles.pdf}
        enablePaging
        fitPolicy={0} // Fit width
        spacing={0}
        minZoom={1.0}
        maxZoom={3.0}
        singlePage={false}
        page={currentPage}
      />

      {!loading && pageCount > 0 && (
        <View style={[styles.pageIndicator, {backgroundColor: colors.surface}]}>
          <Text variant="bodySmall" color="textSecondary">
            Page {currentPage} of {pageCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorMessage: {
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.md,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
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
});

export default PDFViewer;
