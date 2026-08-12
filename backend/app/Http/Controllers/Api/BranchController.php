<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        $branches = Branch::all();
        return $this->sendResponse($branches, 'Branches retrieved successfully');
    }

    public function show($id)
    {
        $branch = Branch::with(['users', 'customers', 'accounts'])->find($id);
        if (!$branch) {
            return $this->sendError('Branch not found', 404);
        }
        return $this->sendResponse($branch, 'Branch details retrieved');
    }
}