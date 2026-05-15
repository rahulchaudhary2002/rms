<?php

namespace App\Http\Requests\Food\Schedule;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFoodScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'outlet_id'    => ['nullable', 'integer', Rule::exists('outlets', 'id')],
            'day_of_week'  => ['required', Rule::in(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])],
            'start_time'   => ['nullable', 'date_format:H:i'],
            'end_time'     => ['nullable', 'date_format:H:i', 'after:start_time'],
            'is_available' => ['nullable', 'boolean'],
        ];
    }
}
