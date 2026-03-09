// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Token} from "../src/Token.sol";

contract TokenTest is Test {
    Token public token;
    address alice = makeAddr("alice");

    function setUp() public {
        token = new Token();
    }

    function test_nameAndSymbol() public view {
        assertEq(token.name(), "Brrrr");
        assertEq(token.symbol(), "BRRRR");
    }

    function test_mint() public {
        token.mint(alice);
        assertEq(token.balanceOf(alice), 1 ether);
        assertEq(token.totalSupply(), 1 ether);
    }

    function test_mintMultiple() public {
        token.mint(alice);
        token.mint(alice);
        token.mint(alice);
        assertEq(token.balanceOf(alice), 3 ether);
    }

    function test_burn() public {
        token.mint(alice);
        vm.prank(alice);
        token.burn(1e18);
        assertEq(token.balanceOf(alice), 0);
        assertEq(token.totalSupply(), 0);
    }

    function test_burnPartial() public {
        token.mint(alice);
        vm.prank(alice);
        token.burn(0.5 ether);
        assertEq(token.balanceOf(alice), 0.5 ether);
    }

    function test_burnMoreThanBalance_reverts() public {
        token.mint(alice);
        vm.prank(alice);
        vm.expectRevert();
        token.burn(2 ether);
    }
}
