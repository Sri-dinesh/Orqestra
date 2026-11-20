import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TimetableSegmentedTabs } from '@/features/timetable-editor/components/TimetableSegmentedTabs';
import { ExportDropdown } from '@/features/timetable-editor/components/ExportDropdown';
import { MoreActionsDropdown } from '@/features/timetable-editor/components/MoreActionsDropdown';

describe('TimetableHeaderControls', () => {
  describe('TimetableSegmentedTabs', () => {
    it('renders all three view tabs and marks the active view', () => {
      render(
        <MemoryRouter>
          <TimetableSegmentedTabs departmentId="dept_1" activeView="section" />
        </MemoryRouter>,
      );

      const sectionLink = screen.getByRole('link', { name: /Section View/i });
      const facultyLink = screen.getByRole('link', { name: /Faculty View/i });
      const masterLink = screen.getByRole('link', { name: /Master Grid/i });

      expect(sectionLink).toBeInTheDocument();
      expect(facultyLink).toBeInTheDocument();
      expect(masterLink).toBeInTheDocument();

      // Check href paths
      expect(sectionLink).toHaveAttribute('href', '/departments/dept_1/timetable');
      expect(facultyLink).toHaveAttribute('href', '/departments/dept_1/faculty-timetable');
      expect(masterLink).toHaveAttribute('href', '/departments/dept_1/master-timetable');
    });
  });

  describe('ExportDropdown', () => {
    it('toggles menu and triggers callbacks', () => {
      const handlePreview = vi.fn();
      const handlePdf = vi.fn();
      const handleExcel = vi.fn();
      const handlePrint = vi.fn();

      render(
        <ExportDropdown
          onPreview={handlePreview}
          onExportPdf={handlePdf}
          onExportExcel={handleExcel}
          onPrint={handlePrint}
        />,
      );

      // Initially closed
      expect(screen.queryByText('Download Official PDF')).not.toBeInTheDocument();

      // Click to open
      const exportButton = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportButton);

      expect(screen.getByText('Download Official PDF')).toBeInTheDocument();
      expect(screen.getByText('Export to Excel')).toBeInTheDocument();
      expect(screen.getByText('Print Schedule')).toBeInTheDocument();
      expect(screen.getByText('Preview & Settings')).toBeInTheDocument();

      // Click PDF option
      fireEvent.click(screen.getByText('Download Official PDF'));
      expect(handlePdf).toHaveBeenCalledTimes(1);

      // Menu should close
      expect(screen.queryByText('Download Official PDF')).not.toBeInTheDocument();
    });

    it('closes on Escape key press', () => {
      render(<ExportDropdown onExportPdf={vi.fn()} />);

      const exportButton = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportButton);
      expect(screen.getByText('Download Official PDF')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByText('Download Official PDF')).not.toBeInTheDocument();
    });
  });

  describe('MoreActionsDropdown', () => {
    it('toggles menu and handles duplicate and delete', () => {
      const handleDuplicate = vi.fn();
      const handleDelete = vi.fn();

      render(
        <MoreActionsDropdown
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />,
      );

      const triggerBtn = screen.getByLabelText('More actions');
      fireEvent.click(triggerBtn);

      expect(screen.getByText('Duplicate Timetable')).toBeInTheDocument();
      expect(screen.getByText('Delete Timetable')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Duplicate Timetable'));
      expect(handleDuplicate).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Duplicate Timetable')).not.toBeInTheDocument();

      // Open again and click delete
      fireEvent.click(triggerBtn);
      fireEvent.click(screen.getByText('Delete Timetable'));
      expect(handleDelete).toHaveBeenCalledTimes(1);
    });
  });
});
