import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface PollCreatorProps {
  onPollCreate: (question: string, options: string[], endsAt?: Date) => void;
  onCancel: () => void;
}

export const PollCreator = ({ onPollCreate, onCancel }: PollCreatorProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState('1');

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    if (!question.trim() || options.some((opt) => !opt.trim())) {
      return;
    }

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + parseInt(duration));

    onPollCreate(question, options, endsAt);
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <Label>Poll Question</Label>
        <Input
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      <div>
        <Label>Options</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
              />
              {options.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {options.length < 4 && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={addOption}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Option
          </Button>
        )}
      </div>

      <div>
        <Label>Poll Duration</Label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="7">1 week</option>
          <option value="14">2 weeks</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleCreate} className="flex-1">
          Create Poll
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
};
