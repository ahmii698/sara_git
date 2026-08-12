<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('branch');

        if ($request->search) {
            $query->where('name', 'LIKE', "%{$request->search}%");
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $products = $query->paginate(20);
        return $this->sendResponse($products, 'Products retrieved');
    }

    public function show($id)
    {
        $product = Product::with('branch')->find($id);
        if (!$product) {
            return $this->sendError('Product not found', 404);
        }
        return $this->sendResponse($product, 'Product details');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|in:new,used',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:branches,id'
        ]);

        $product = Product::create($request->all());
        return $this->sendResponse($product, 'Product created', 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return $this->sendError('Product not found', 404);
        }

        $product->update($request->all());
        return $this->sendResponse($product, 'Product updated');
    }

    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return $this->sendError('Product not found', 404);
        }

        $product->delete();
        return $this->sendResponse(null, 'Product deleted');
    }
}