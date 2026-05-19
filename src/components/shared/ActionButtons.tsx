import React from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  Save, 
  ArrowLeft 
} from 'lucide-react';
import Button, { ButtonProps } from './Button';

/**
 * Pre-defined professional buttons for common actions.
 * No need to rewrite icons or colors every time.
 */

export const AddButton = (props: ButtonProps) => (
  <Button variant="primary" icon={Plus} {...props}>
    {props.children || 'Add New'}
  </Button>
);

export const EditButton = (props: ButtonProps) => (
  <Button variant="ghost" size="sm" icon={Edit2} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" {...props} />
);

export const DeleteButton = (props: ButtonProps) => (
  <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:text-red-700 hover:bg-red-50" {...props} />
);

export const SaveButton = (props: ButtonProps) => (
  <Button variant="success" icon={Save} {...props}>
    {props.children || 'Save Changes'}
  </Button>
);

export const ExportButton = (props: ButtonProps) => (
  <Button variant="outline" icon={Download} {...props}>
    {props.children || 'Export'}
  </Button>
);

export const BackButton = (props: ButtonProps) => (
  <Button variant="ghost" icon={ArrowLeft} {...props}>
    {props.children || 'Back'}
  </Button>
);

export const SearchButton = (props: ButtonProps) => (
  <Button variant="primary" size="sm" icon={Search} {...props} />
);
