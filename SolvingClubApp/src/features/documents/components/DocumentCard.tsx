import React from 'react';
import {View, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import {Document, DocumentType} from '../types';
import {useColors} from '../../../core/theme/colors';
import {Spacing} from '../../../core/constants';
import {Text} from '../../../shared/components';

interface DocumentCardProps {
  document: Document;
  onPress: () => void;
}

/**
 * Get icon and color for document type
 */
const getDocumentTypeInfo = (type: DocumentType) => {
  switch (type) {
    case 'quotation':
      return {icon: '📄', color: '#3B82F6', label: 'Quotation'};
    case 'invoice':
      return {icon: '💰', color: '#10B981', label: 'Invoice'};
    case 'contract':
      return {icon: '📝', color: '#8B5CF6', label: 'Contract'};
    case 'proposal':
      return {icon: '📋', color: '#F59E0B', label: 'Proposal'};
    default:
      return {icon: '📑', color: '#6B7280', label: 'Document'};
  }
};

/**
 * Format file size
 */
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format date
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Document Card Component
 * Displays document information in a card format
 */
const DocumentCard: React.FC<DocumentCardProps> = ({document, onPress}) => {
  const colors = useColors();
  const typeInfo = getDocumentTypeInfo(document.type);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 2,
            },
          }),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {backgroundColor: typeInfo.color + '20'},
          ]}>
          <Text style={styles.icon}>{typeInfo.icon}</Text>
        </View>
        <View style={styles.headerText}>
          <Text variant="bodyLarge" style={styles.title} numberOfLines={2}>
            {document.title}
          </Text>
          <View style={styles.typeContainer}>
            <View
              style={[
                styles.typeBadge,
                {backgroundColor: typeInfo.color + '15'},
              ]}>
              <Text
                variant="bodySmall"
                style={[styles.typeText, {color: typeInfo.color}]}>
                {typeInfo.label}
              </Text>
            </View>
            {document.status && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      document.status === 'approved'
                        ? '#10B98120'
                        : document.status === 'rejected'
                        ? '#EF444420'
                        : '#F59E0B20',
                  },
                ]}>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.statusText,
                    {
                      color:
                        document.status === 'approved'
                          ? '#10B981'
                          : document.status === 'rejected'
                          ? '#EF4444'
                          : '#F59E0B',
                    },
                  ]}>
                  {document.status.charAt(0).toUpperCase() +
                    document.status.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Details */}
      {(document.clientName || document.projectName) && (
        <View style={styles.details}>
          {document.clientName && (
            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="textSecondary">
                Client:
              </Text>
              <Text variant="bodySmall" style={styles.detailValue}>
                {document.clientName}
              </Text>
            </View>
          )}
          {document.projectName && (
            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="textSecondary">
                Project:
              </Text>
              <Text variant="bodySmall" style={styles.detailValue}>
                {document.projectName}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="bodySmall" color="textTertiary">
          {formatDate(document.createdAt)}
        </Text>
        <Text variant="bodySmall" color="textTertiary">
          {formatFileSize(document.fileSize)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontWeight: '600',
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 11,
  },
  details: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  detailValue: {
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export default DocumentCard;
