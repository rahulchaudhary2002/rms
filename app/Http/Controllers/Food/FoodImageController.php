<?php

namespace App\Http\Controllers\Food;

use App\Http\Controllers\Controller;
use App\Models\Food;
use App\Models\FoodImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FoodImageController extends Controller
{
    public function store(Request $request, Food $food): RedirectResponse
    {
        $request->validate([
            'image'      => ['required', 'image', 'max:4096'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $path = $request->file('image')->store('food-images', 'public');

        if ($request->boolean('is_primary')) {
            $food->images()->update(['is_primary' => false]);
        }

        $sortOrder = $food->images()->max('sort_order') + 1;

        FoodImage::create([
            'food_id'    => $food->id,
            'image'      => $path,
            'is_primary' => $request->boolean('is_primary', $food->images()->count() === 0),
            'sort_order' => $sortOrder,
        ]);

        return back()->with('success', 'Image uploaded.');
    }

    public function setPrimary(Food $food, FoodImage $image): RedirectResponse
    {
        abort_unless($image->food_id === $food->id, 404);

        $food->images()->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);

        return back()->with('success', 'Primary image updated.');
    }

    public function destroy(Food $food, FoodImage $image): RedirectResponse
    {
        abort_unless($image->food_id === $food->id, 404);

        Storage::disk('public')->delete($image->image);
        $image->delete();

        if ($image->is_primary) {
            $food->images()->oldest('sort_order')->first()?->update(['is_primary' => true]);
        }

        return back()->with('success', 'Image deleted.');
    }

    public function reorder(Request $request, Food $food): RedirectResponse
    {
        $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:food_images,id'],
        ]);

        foreach ($request->input('ids') as $order => $id) {
            $food->images()->where('id', $id)->update(['sort_order' => $order]);
        }

        return back()->with('success', 'Images reordered.');
    }
}
