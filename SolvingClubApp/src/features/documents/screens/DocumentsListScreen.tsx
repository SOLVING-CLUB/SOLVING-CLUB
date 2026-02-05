import React, {useState, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useColors} from '../../../core/theme/colors';
import {Spacing} from '../../../core/constants';
import {Text, Button} from '../../../shared/components';
import {RootStackParamList} from '../../../app/navigation/types';
import {mockDocuments, getDocumentsByType} from '../data/mockDocuments';
import {Document, DocumentType} from '../types';
import DocumentCard from '../components/DocumentCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DocumentsList'>;

/**
 * Documents List Screen
 * Shows all documents/quotations with filtering by type
 */
const DocumentsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colors = useColors();
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all');

  const documentTypes: Array<{type: DocumentType | 'all'; label: string; icon: string}> = [
    {type: 'all', label: 'All', icon: '📚'},
    {type: 'quotation', label: 'Quotations', icon: '📄'},
    {type: 'invoice', label: 'Invoices', icon: '💰'},
    {type: 'contract', label: 'Contracts', icon: '📝'},
    {type: 'proposal', label: 'Proposals', icon: '📋'},
  ];

  const filteredDocuments = useMemo(() => {
    if (selectedType === 'all') {
      return mockDocuments;
    }
    return getDocumentsByType(selectedType);
  }, [selectedType]);

  const handleDocumentPress = (document: Document) => {
    navigation.navigate('DocumentViewer', {documentId: document.id});
  };

  const renderDocumentCard = ({item}: {item: Document}) => (
    <DocumentCard document={item} onPress={() => handleDocumentPress(item)} />
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.surface}]}>
        <View style={styles.headerContent}>
          <Text variant="h2" style={styles.title}>
            Documents & Quotations
          </Text>
          <Text variant="body" color="textSecondary">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}>
        {documentTypes.map(type => (
          <TouchableOpacity
            key={type.type}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  selectedType === type.type ? colors.primary : colors.surface,
                borderColor:
                  selectedType === type.type ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedType(type.type)}>
            <Text
              variant="body"
              style={[
                styles.filterText,
                {
                  color:
                    selectedType === type.type
                      ? '#FFFFFF'
                      : colors.textPrimary,
                },
              ]}>
              {type.icon} {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
        <FlatList
          data={filteredDocuments}
          renderItem={renderDocumentCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text variant="h3" center style={styles.emptyIcon}>
            📭
          </Text>
          <Text variant="h3" center style={styles.emptyTitle}>
            No Documents Found
          </Text>
          <Text variant="body" color="textSecondary" center style={styles.emptyText}>
            No {selectedType === 'all' ? '' : selectedType + ' '}documents available
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
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
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
    marginTop: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  filterContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  filterText: {
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    maxWidth: 280,
  },
});

export default DocumentsListScreen;
